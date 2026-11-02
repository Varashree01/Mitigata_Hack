import networkx as nx
from typing import List, Dict, Any
from backend.app.schemas import ForwardReachabilityResult, ReachabilityTarget
from backend.app.exposure.asset_inventory import ASSET_INVENTORY, NETWORK_TOPOLOGY_EDGES
from backend.app.storage import db

class ReachabilityEngine:
    def __init__(self):
        # Build enterprise topology directed graph
        self.topo_graph = nx.DiGraph()
        for asset_id, meta in ASSET_INVENTORY.items():
            self.topo_graph.add_node(asset_id, **meta)
        for edge in NETWORK_TOPOLOGY_EDGES:
            self.topo_graph.add_edge(
                edge["source"],
                edge["target"],
                port=edge["port"],
                protocol=edge["protocol"],
                rel_type=edge["type"]
            )

    def analyze_reachability(self, incident_id: str) -> ForwardReachabilityResult:
        incident = db.get_incident(incident_id)
        if not incident:
            return ForwardReachabilityResult(
                incident_id=incident_id,
                compromised_hosts=[],
                compromised_users=[],
                potential_next_targets=[],
                blast_radius_summary="Incident not found",
                recommended_mitigations=[]
            )

        compromised_hosts = set(incident["affected_hosts"])
        compromised_users = set(incident["affected_users"])

        potential_targets: List[ReachabilityTarget] = []
        visited_targets = set()

        # Find paths from any compromised host to critical assets
        for comp_host in compromised_hosts:
            if comp_host not in self.topo_graph:
                continue

            for target_asset_id, asset_meta in ASSET_INVENTORY.items():
                if target_asset_id in compromised_hosts:
                    continue  # Already compromised, not a "next" target

                if target_asset_id in visited_targets:
                    continue

                if target_asset_id not in self.topo_graph:
                    continue

                if nx.has_path(self.topo_graph, comp_host, target_asset_id):
                    path = nx.shortest_path(self.topo_graph, comp_host, target_asset_id)
                    hops = len(path) - 1
                    
                    crit = asset_meta["criticality"]
                    crit_mult = {"Critical": 30.0, "High": 20.0, "Medium": 10.0, "Low": 5.0}.get(crit, 10.0)
                    exposure_score = round(max(5.0, crit_mult / hops * 2.0), 1)

                    # Formulate clear assumptions & distinguish reachability from compromise
                    rel_type = "network_path_exposure"
                    if "DC" in target_asset_id:
                        reach_type = "Domain Controller Lateral Escalation"
                        assumptions = "Assumes attacker leverages unpatched SMB or dumps cached domain credentials on intermediate server."
                        missing = "No Kerberos TGT request or privileged RPC bind observed yet in logs."
                    elif "DB" in target_asset_id:
                        reach_type = "Database Breach / Data Exfiltration"
                        assumptions = "Assumes hardcoded database credentials reside on build/staging server."
                        missing = "No SQL port 5432 outbound connection or schema query recorded."
                    elif "PAY" in target_asset_id:
                        reach_type = "Cardholder Vault Infiltration"
                        assumptions = "Assumes attacker achieves Domain Admin rights on DC-01 to pivot through admin jump box."
                        missing = "Multi-factor authentication (mTLS) token required; no token theft observed."
                    else:
                        reach_type = "Lateral Share Traversal"
                        assumptions = "Network route open via corporate LAN."
                        missing = "No authentication attempt detected on target host."

                    potential_targets.append(ReachabilityTarget(
                        target_asset=target_asset_id,
                        asset_name=asset_meta["name"],
                        asset_criticality=crit,
                        hops_away=hops,
                        path=path,
                        reachability_type=reach_type,
                        missing_evidence=missing,
                        assumptions=assumptions,
                        exposure_score=exposure_score
                    ))
                    visited_targets.add(target_asset_id)

        # Sort targets by criticality and exposure score
        potential_targets.sort(key=lambda x: (0 if x.asset_criticality == "Critical" else (1 if x.asset_criticality == "High" else 2), -x.exposure_score))

        blast_summary = (
            f"From {len(compromised_hosts)} compromised host(s), attacker has potential forward reachability "
            f"to {len(potential_targets)} uncompromised enterprise asset(s), including "
            f"{sum(1 for t in potential_targets if t.asset_criticality == 'Critical')} Critical Tier-0 system(s)."
        )

        mitigations = [
            f"Isolate host(s) {', '.join(compromised_hosts)} at network switch/EDR boundary immediately.",
            "Rotate domain administrator credentials and invalidate all Active Directory Kerberos ticket-granting tickets (KRBTGT).",
            "Block lateral SMB (445) and RDP (3389) traffic between user workstation subnets and server VLANs.",
            "Enforce strict jumpbox-only access with FIDO2 MFA for Domain Controllers and Payment Vaults."
        ]

        return ForwardReachabilityResult(
            incident_id=incident_id,
            compromised_hosts=list(compromised_hosts),
            compromised_users=list(compromised_users),
            potential_next_targets=potential_targets,
            blast_radius_summary=blast_summary,
            recommended_mitigations=mitigations
        )

reachability_engine = ReachabilityEngine()
