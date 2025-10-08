import unittest
import json

from shared.public import regroup_ranges, port_ranges_string, get_public_nodes
from shared.common import parse_arguments


class TestPublic(unittest.TestCase):
    def test_regroup_ranges(self):
        self.assertEqual(regroup_ranges([[80, 80], [80, 80]]), [(80, 80)])
        self.assertEqual(regroup_ranges([[80, 80], [0, 65000]]), [(0, 65000)])
        self.assertEqual(regroup_ranges([]), [])
        self.assertEqual(regroup_ranges([[80, 80], [443, 443]]), [[80, 80], [443, 443]])

    def test_port_ranges_string(self):
        self.assertEqual(port_ranges_string([[80, 80], [443, 445]]), "80,443-445")

    def test_get_public_nodes(self):
        args, accounts, config = parse_arguments(
            ["--accounts", "demo", "--config", "config.json.demo"], None
        )

        public_nodes, warnings = get_public_nodes(accounts[0], config)

        self.assertEqual(len(public_nodes), 3)

        # Check sizes of other items
        self.assertEqual(len(public_nodes[0]), 6)

        public_nodes[0]

        ecs_nodes = []
        elb_nodes = []
        elbv2_nodes = []
        print(public_nodes)
        for node in public_nodes:
            if node["type"] == "ecs":
                ecs_nodes.append(node)
            if node["type"] == "elb":
                elb_nodes.append(node)
            if node["type"] == "elbv2":
                elbv2_nodes.append(node)

        self.assertEqual(len(ecs_nodes), 1)
        self.assertEqual(ecs_nodes[0]["ports"], "443")

        self.assertEqual(len(elb_nodes), 1)
        self.assertEqual(len(elbv2_nodes), 1)
