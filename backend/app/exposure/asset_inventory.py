from typing import Dict, Any, List

# Enterprise Environment Topology & Critical Assets
ASSET_INVENTORY: Dict[str, Dict[str, Any]] = {
    "DC-01": {
        "name": "Primary Domain Controller",
        "criticality": "Critical",
        "ip": "10.0.10.10",
        "subnet": "10.0.10.0/24 (Management)",
        "services": ["Kerberos (88)", "LDAP (389)", "SMB (445)", "DNS (53)"],
        "admin_groups": ["Domain Admins", "Enterprise Admins"]
    },
    "DC-02": {
        "name": "Backup Domain Controller",
        "criticality": "Critical",
        "ip": "10.0.10.11",
        "subnet": "10.0.10.0/24 (Management)",
        "services": ["Kerberos (88)", "LDAP (389)", "SMB (445)"],
        "admin_groups": ["Domain Admins"]
    },
    "DB-PROD-01": {
        "name": "Production Database (Customer Data)",
        "criticality": "Critical",
        "ip": "10.0.20.50",
        "subnet": "10.0.20.0/24 (Data Tier)",
        "services": ["PostgreSQL (5432)", "SSH (22)"],
        "admin_groups": ["DBA Admins", "DevOps"]
    },
    "FS-02": {
        "name": "Corporate File Server",
        "criticality": "High",
        "ip": "10.0.30.22",
        "subnet": "10.0.30.0/24 (File Shares)",
        "services": ["SMB (445)", "NFS (2049)"],
        "admin_groups": ["IT Support", "Domain Admins"]
    },
    "PAY-VAULT-01": {
        "name": "PCI-DSS Payment Gateway Vault",
        "criticality": "Critical",
        "ip": "10.0.99.100",
        "subnet": "10.0.99.0/24 (Isolated Cardholder Zone)",
        "services": ["HTTPS (8443)", "mTLS"],
        "admin_groups": ["SecOps Tier-3"]
    },
    "SRV-BUILD-01": {
        "name": "CI/CD Pipeline Build Server",
        "criticality": "High",
        "ip": "10.0.40.15",
        "subnet": "10.0.40.0/24 (DevOps)",
        "services": ["Jenkins (8080)", "Docker (2375)"],
        "admin_groups": ["DevOps"]
    },
    "HR-07": {
        "name": "Workstation HR-07",
        "criticality": "Low",
        "ip": "192.168.1.107",
        "subnet": "192.168.1.0/24 (User Workstations)",
        "services": ["RDP (3389)"],
        "admin_groups": ["Local Admin"]
    },
    "WS-FIN-12": {
        "name": "Workstation Finance-12",
        "criticality": "Medium",
        "ip": "192.168.1.112",
        "subnet": "192.168.1.0/24 (User Workstations)",
        "services": ["RDP (3389)"],
        "admin_groups": ["Local Admin"]
    }
}

# Network ACL Connectivity Rules: Source Host/Subnet -> Allowed Destination Assets
NETWORK_TOPOLOGY_EDGES: List[Dict[str, Any]] = [
    {"source": "HR-07", "target": "FS-02", "port": 445, "protocol": "SMB", "type": "authorized_share_access"},
    {"source": "HR-07", "target": "WS-FIN-12", "port": 3389, "protocol": "RDP", "type": "workstation_to_workstation"},
    {"source": "WS-FIN-12", "target": "FS-02", "port": 445, "protocol": "SMB", "type": "authorized_share_access"},
    {"source": "FS-02", "target": "DC-01", "port": 445, "protocol": "SMB", "type": "domain_auth_replication"},
    {"source": "FS-02", "target": "SRV-BUILD-01", "port": 22, "protocol": "SSH", "type": "backup_rsync"},
    {"source": "SRV-BUILD-01", "target": "DB-PROD-01", "port": 5432, "protocol": "PostgreSQL", "type": "db_migration_access"},
    {"source": "DC-01", "target": "PAY-VAULT-01", "port": 8443, "protocol": "HTTPS", "type": "bastion_privileged_session"}
]
