from __future__ import print_function
from shared.query import query_aws, get_parameter_file
from shared.common import Finding

# To use custom auditing, you must copy this file to ./private_commands/custom_auditor.py
# and uncomment and modify the functions below.

__description__ = "Custom auditing functions"

# def custom_audit_guardduty(findings, region):
#     """
#     A custom auditor must be named a method that starts with "custom_audit_"
#     You can create your own private auditors without needing to fork the project.
#     You can mute the real ones, such as GUARDDUTY_OFF, and use your own.
#     Note that you must add your own ID's and other info to audit_config_override.yaml
#     """

#     #
#     # Custom logic
#     #
#     if region.name not in ['ap-southeast-1']:
#         return

#     #
#     # The rest of this function is the same as real one
#     #
#     detector_list_json = query_aws(
#         region.account, "guardduty-list-detectors", region
#     )
#     if not detector_list_json:
#         # GuardDuty must not exist in this region (or the collect data is old)
#         return
#     is_enabled = False
#     for detector in detector_list_json["DetectorIds"]:
#         detector_json = get_parameter_file(
#             region, "guardduty", "get-detector", detector
#         )
#         if detector_json["Status"] == "ENABLED":
#             is_enabled = True
#     if not is_enabled:
#         findings.add(Finding(region, "CUSTOM_GUARDDUTY_OFF", None, None))


# def custom_filter(finding, conf):
#     """
#     Return True if the finding should be filtered, or false to allow it.
#     """

#     # This filters the GUARDDUTY_OFF rule, so that it only alerts if GuardDuty 
#     # is off in ap-southeast-1.  This is useful if you have SCPs or similar to
#     # disable other regions and therefore only care about issues in ap-southeast-1.
#     if finding.issue_id == 'GUARDDUTY_OFF' and finding.region.name not in ['ap-southeast-1']:
#         return True
    
#     # Accessible data includes:
#     # - finding.issue_id: Ex. "GUARDDUTY_OFF"
#     # - finding.region.name: Ex. "ap-southeast-1"
#     # - finding.region.account.name: The account name: Ex. "prod"
#     # - finding.region.account.local_id: The Accoutn ID: Ex. "000000000000"
#     # - finding.resource_id: Ex. the S3 bucket name
#     # - finding.resource_details: The dictionary associated with the finding
#     #     The resource_details are finding type specific.
#     # - conf["severity"]
#     # - conf["title"]
#     # - conf["description"]

#     # Note that you could also modify the title, severity, etc.
    
#     return False
