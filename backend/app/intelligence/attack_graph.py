import networkx as nx
from typing import Dict, Any, List, Optional
from backend.app.schemas import (
    AttackGraphPayload, CytoscapeNode, CytoscapeNodeData,
    CytoscapeEdge, CytoscapeEdgeData
)
from backend.app.storage import db

class AttackGraphBuilder:
    def build_incident_graph(self, incident_id: str, include_exposure: bool = True) -> AttackGraphPayload:
        incident = db.get_incident(incident_id)
        if not incident:
            return AttackGraphPayload(incident_id=incident_id, nodes=[], edges=[], summary={"error": "Incident not found"})

        G = nx.DiGraph()
        nodes_dict: Dict[str, CytoscapeNodeData] = {}
        edges_list: List[CytoscapeEdge] = []

        # 1. Add known compromised entities from incident
        for h in incident["affected_hosts"]:
            node_id = f"host_{h}"
            is_tgt = any(srv in h.lower() for srv in ["dc", "srv", "db", "sql", "file"])
            nodes_dict[node_id] = CytoscapeNodeData(
                id=node_id,
                label=h,
                entity_type="host",
                severity="critical" if is_tgt else incident["severity"],
                is_compromised=True,
                is_target=is_tgt,
                is_hypothetical=False,
                details={"host_name": h, "status": "Compromised Host"}
            )

        for u in incident["affected_users"]:
            node_id = f"user_{u}"
            nodes_dict[node_id] = CytoscapeNodeData(
                id=node_id,
                label=u,
                entity_type="user",
                severity=incident["severity"],
                is_compromised=True,
                is_target=False,
                is_hypothetical=False,
                details={"username": u, "status": "Compromised Account"}
            )

        # 2. Add edges from stored verified relationships
        rels = db.get_relationships(incident_id)
        edge_idx = 0
        for r in rels:
            src_prefix = "user_" if r["source_type"] == "user" else ("host_" if r["source_type"] == "host" else ("ip_" if r["source_type"] == "ip" else "proc_"))
            tgt_prefix = "user_" if r["target_type"] == "user" else ("host_" if r["target_type"] == "host" else ("ip_" if r["target_type"] == "ip" else "proc_"))

            src_id = f"{src_prefix}{r['source_entity']}"
            tgt_id = f"{tgt_prefix}{r['target_entity']}"

            # Ensure source and target nodes exist in graph
            if src_id not in nodes_dict:
                nodes_dict[src_id] = CytoscapeNodeData(
                    id=src_id,
                    label=r["source_entity"],
                    entity_type=r["source_type"],
                    severity="medium",
                    is_compromised=True,
                    is_target=False,
                    is_hypothetical=False,
                    details={"type": r["source_type"]}
                )
            if tgt_id not in nodes_dict:
                nodes_dict[tgt_id] = CytoscapeNodeData(
                    id=tgt_id,
                    label=r["target_entity"],
                    entity_type=r["target_type"],
                    severity="high",
                    is_compromised=True,
                    is_target=False,
                    is_hypothetical=False,
                    details={"type": r["target_type"]}
                )

            edge_id = f"edge_{incident_id}_{edge_idx}"
            edge_idx += 1
            edges_list.append(CytoscapeEdge(
                data=CytoscapeEdgeData(
                    id=edge_id,
                    source=src_id,
                    target=tgt_id,
                    label=r["relationship_type"].replace("_", " ").title(),
                    relationship_type=r["relationship_type"],
                    confidence=r["confidence"],
                    is_inferred=r["is_inferred"],
                    is_potential_path=False,
                    evidence_event_ids=r["evidence_event_ids"],
                    timestamp=r["timestamp"]
                )
            ))
            G.add_edge(src_id, tgt_id, relationship=r["relationship_type"])

        # 3. Add detections as nodes/links if not present
        dets = db.get_detections(incident_id=incident_id)
        for d in dets:
            if d.get("host") and d.get("source_ip"):
                ip_id = f"ip_{d['source_ip']}"
                host_id = f"host_{d['host']}"
                if ip_id not in nodes_dict:
                    nodes_dict[ip_id] = CytoscapeNodeData(
                        id=ip_id,
                        label=d["source_ip"],
                        entity_type="ip",
                        severity="high",
                        is_compromised=True,
                        is_target=False,
                        is_hypothetical=False,
                        details={"ip": d["source_ip"], "type": "External Attacker IP"}
                    )
                if host_id in nodes_dict:
                    e_id = f"edge_c2_{edge_idx}"
                    edge_idx += 1
                    edges_list.append(CytoscapeEdge(
                        data=CytoscapeEdgeData(
                            id=e_id,
                            source=ip_id,
                            target=host_id,
                            label=f"{d['technique_name']} ({d['technique_id']})",
                            relationship_type="EXPLOITED",
                            confidence=d["confidence"],
                            is_inferred=False,
                            is_potential_path=False,
                            evidence_event_ids=d["event_references"],
                            timestamp=d["timestamp"]
                        )
                    ))

        # 4. Include Reachability / Forward Exposure as distinct hypothetical dashed edges
        if include_exposure:
            from backend.app.exposure.reachability import reachability_engine
            reach_result = reachability_engine.analyze_reachability(incident_id)
            for target in reach_result.potential_next_targets:
                tgt_node_id = f"asset_{target.target_asset}"
                if tgt_node_id not in nodes_dict:
                    nodes_dict[tgt_node_id] = CytoscapeNodeData(
                        id=tgt_node_id,
                        label=f"{target.asset_name} ({target.target_asset})",
                        entity_type="asset",
                        severity="critical" if target.asset_criticality == "Critical" else "high",
                        is_compromised=False,  # STRICT: Never display potential attack path as confirmed compromise!
                        is_target=True,
                        is_hypothetical=True,
                        details={
                            "criticality": target.asset_criticality,
                            "hops": target.hops_away,
                            "assumptions": target.assumptions
                        }
                    )
                # Connect from the intermediate host
                intermediate = f"host_{target.path[-2]}" if len(target.path) >= 2 else (f"host_{incident['affected_hosts'][-1]}" if incident["affected_hosts"] else None)
                if intermediate and intermediate in nodes_dict:
                    edge_id = f"edge_hypo_{edge_idx}"
                    edge_idx += 1
                    edges_list.append(CytoscapeEdge(
                        data=CytoscapeEdgeData(
                            id=edge_id,
                            source=intermediate,
                            target=tgt_node_id,
                            label=f"Potential: {target.reachability_type.replace('_', ' ').title()}",
                            relationship_type="POTENTIAL_REACHABILITY",
                            confidence=0.5,
                            is_inferred=True,
                            is_potential_path=True,
                            evidence_event_ids=[],
                            timestamp=None
                        )
                    ))

        cytoscape_nodes = [CytoscapeNode(data=n) for n in nodes_dict.values()]

        summary = {
            "incident_id": incident_id,
            "total_nodes": len(cytoscape_nodes),
            "total_edges": len(edges_list),
            "compromised_nodes": sum(1 for n in cytoscape_nodes if n.data.is_compromised),
            "hypothetical_targets": sum(1 for n in cytoscape_nodes if n.data.is_hypothetical),
            "risk_score": incident["risk_score"]
        }

        return AttackGraphPayload(
            incident_id=incident_id,
            nodes=cytoscape_nodes,
            edges=edges_list,
            summary=summary
        )

    def build_incident_timeline(self, incident_id: str) -> List[Dict[str, Any]]:
        dets = db.get_detections(incident_id=incident_id)
        rels = db.get_relationships(incident_id=incident_id)

        timeline_items = []

        # Add detections to timeline
        for d in dets:
            timeline_items.append({
                "id": d["detection_id"],
                "type": "detection",
                "timestamp": d["timestamp"],
                "title": f"Detection: {d['rule_name']}",
                "description": d["explanation"],
                "severity": d["severity"],
                "kill_chain_stage": d["kill_chain_stage"],
                "technique_id": d["technique_id"],
                "technique_name": d["technique_name"],
                "tactic": d["tactic"],
                "host": d.get("host"),
                "user": d.get("user"),
                "event_references": d["event_references"],
                "confidence": d["confidence"]
            })

        # Add significant relationships
        for r in rels:
            timeline_items.append({
                "id": f"rel-{r['id']}",
                "type": "relationship",
                "timestamp": r["timestamp"],
                "title": f"Action: {r['source_entity']} {r['relationship_type'].replace('_', ' ')} {r['target_entity']}",
                "description": f"Verified {r['relationship_type']} between {r['source_type']} '{r['source_entity']}' and {r['target_type']} '{r['target_entity']}'.",
                "severity": "medium",
                "kill_chain_stage": "Lateral Movement" if r["relationship_type"] == "CONNECTED_TO" else "Execution",
                "technique_id": "T1021" if r["relationship_type"] == "CONNECTED_TO" else "T1059",
                "technique_name": "Lateral Movement / Connection",
                "tactic": "Lateral Movement",
                "host": r["target_entity"] if r["target_type"] == "host" else r["source_entity"],
                "user": r["source_entity"] if r["source_type"] == "user" else None,
                "event_references": r["evidence_event_ids"],
                "confidence": r["confidence"]
            })

        timeline_items.sort(key=lambda x: x["timestamp"])
        return timeline_items

attack_graph_builder = AttackGraphBuilder()
