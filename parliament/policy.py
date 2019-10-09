import json

from .statement import Statement
from .finding import severity, Finding
from .misc import make_list, ACCESS_DECISION


class Policy:
    _findings = []
    policy_json = None
    version = None
    statements = []
    policy = None

    def __init__(self, policy_json, filepath=None):
        self._findings = []
        self.statements = []
        self.policy_json = policy_json
        self.filepath = filepath

    def add_finding(self, finding, severity, location={}):
        if "filepath" not in location:
            location["filepath"] = self.filepath
        self._findings.append(Finding(finding, severity, location))

    @property
    def findings(self):
        all_findings = []
        all_findings.extend(self._findings)

        for stmt in self.statements:
            for finding in stmt.findings:
                if "filepath" not in finding.location:
                    finding.location["filepath"] = self.filepath

                all_findings.append(finding)

        return all_findings

    @property
    def is_valid(self):
        for stmt in self.statements:
            if not stmt.is_valid:
                return False
        return True

    def get_references(self, privilege_prefix, privilege_name):
        """
        Identify all statements that reference this privilege,
        then return a dictionary where the keys are the resources referenced by the statements,
        and the values are a list of the statements
        """
        references = {}
        for stmt in self.statements:
            stmt_relevant_resources = stmt.get_resources_for_privilege(
                privilege_prefix, privilege_name
            )
            for resource in stmt_relevant_resources:
                references[resource] = references.get(resource, [])
                references[resource].append(stmt)
        return references

    def get_allowed_resources(self, privilege_prefix, privilege_name):
        """
        Given a privilege like s3:GetObject, identify all the resources (if any),
        this is allowed to be used with.

        Examples, assuming given "s3" "GetObject":
        - With a policy with s3:* on "*", this would return "*"
        - With a policy with s3:* on ["arn:aws:s3:::examplebucket", "arn:aws:s3:::examplebucket/*"],
          this would only return "arn:aws:s3:::examplebucket/*" because that is the only object resource.
        """

        def __is_allowed(stmts):
            """
            Given statements that are all relevant to the same resource and privilege,
            (meaning each statement must have an explicit allow or deny on the privilege) 
            determine if it is allowed, which means no Deny effects.
            """
            for stmt in stmts:
                if not stmt.effect_allow:
                    return False
            return True

        allowed_resources = []
        all_references = self.get_references(privilege_prefix, privilege_name)
        for resource in all_references:
            if __is_allowed(all_references[resource]):
                allowed_resources.append(resource)

        return allowed_resources

    def check_for_bad_patterns(self):
        """
        Look for privileges across multiple statements that result in problems such as privilege escalation.
        """

        def check_bucket_privesc(refs, bucket_privilege, object_privilege):
            # If the bucket privilege exists for a bucket, but not the object privilege for objects
            # in that bucket then the bucket privilege can be abused to get that object privilege
            for resource in refs[bucket_privilege]:
                if not (
                    resource in refs[object_privilege]
                    or resource + "/*" in refs[object_privilege]
                ):
                    self.add_finding(
                        "Possible resource policy privilege escalation on {} due to s3:{} not being allowed, but does allow s3:{}".format(
                            resource, object_privilege, bucket_privilege
                        ),
                        severity.LOW,
                        location={},
                    )

        # Get the resource references we'll be using
        refs = {}
        for priv in [
            "PutBucketPolicy",
            "PutBucketAcl",
            "PutLifecycleConfiguration",
            "PutObject",
            "GetObject",
            "DeleteObject",
        ]:
            refs[priv] = self.get_allowed_resources("s3", priv)

        # Check each bad combination.  If the bucket level privilege is allowed,
        # but not the object level privilege, then we likely have a privilege escalation issue.
        check_bucket_privesc(refs, "PutBucketPolicy", "PutObject")
        check_bucket_privesc(refs, "PutBucketPolicy", "GetObject")
        check_bucket_privesc(refs, "PutBucketPolicy", "DeleteObject")

        check_bucket_privesc(refs, "PutBucketAcl", "PutObject")
        check_bucket_privesc(refs, "PutBucketAcl", "GetObject")
        check_bucket_privesc(refs, "PutBucketAcl", "DeleteObject")

        check_bucket_privesc(refs, "PutLifecycleConfiguration", "DeleteObject")

    def analyze(self):
        """
        Returns False if this policy is so broken that it couldn't be analyzed further.
        On True, it may still have findings.

        In either case, it will create Findings if there are any.
        """

        # Check no unknown elements exist
        for element in self.policy_json:
            if element not in ["Version", "Statement", "Id"]:
                self.add_finding(
                    "Policy contains an unknown element",
                    severity.MALFORMED,
                    location={"string": element},
                )
                return False

        # Check Version
        if "Version" not in self.policy_json:
            self.add_finding(
                "Policy does not contain a Version element", severity.MALFORMED
            )
            return False
        self.version = self.policy_json["Version"]

        if self.version not in ["2012-10-17", "2008-10-17"]:
            self.add_finding(
                "Unknown Version used. Version must be either 2012-10-17 or 2008-10-17",
                severity.INVALID,
                location={"string": self.version},
            )
        elif self.version != "2012-10-17":
            # TODO I should have a check so that if an older version is being used,
            # and a variable is detected, it should be marked as higher severity.
            self.add_finding(
                "Older version used. Variables will not be allowed.",
                severity.LOW,
                location={"string": self.version},
            )

        # Check Statements
        if "Statement" not in self.policy_json:
            self.add_finding(
                "Policy does not contain a Statement element", severity.MALFORMED
            )
            return False
        stmts_json = make_list(self.policy_json["Statement"])
        for stmt_json in stmts_json:
            stmt = Statement(stmt_json)
            self.statements.append(stmt)

        if not self.is_valid:
            # Do not continue. Further checks will not work with invalid statements.
            return False

        # Look for bad patterns
        self.check_for_bad_patterns()

        return True
