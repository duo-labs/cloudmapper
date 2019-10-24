
class severity:
    """ Used by Findings """

    MALFORMED = 1  # Policy is so broken it cannot be checked further
    INVALID = 2  # Policy does not comply with documented rules
    HIGH = 3
    MEDIUM = 4
    LOW = 5


class Finding:
    """ Class for storing findings """

    issue = ""
    severity = ""
    location = {}

    def __init__(self, issue, severity, location):
        self.issue = issue
        self.severity = severity
        self.location = location

    def __repr__(self):
        """ Return a string for printing """
        return "{} - {} - {}".format(self.severity_name(), self.issue, self.location)

    def severity_name(self):
        if self.severity == severity.MALFORMED:
            return "MALFORMED"
        elif self.severity == severity.INVALID:
            return "INVALID"
        elif self.severity == severity.HIGH:
            return "HIGH"
        elif self.severity == severity.MEDIUM:
            return "MEDIUM"
        elif self.severity == severity.LOW:
            return "LOW"
        else:
            raise Exception("Unknown severity: {}".format(self.severity))
