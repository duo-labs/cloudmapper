def make_list(v):
    """
    If the object is not a list already, it converts it to one
    Examples:
    [1, 2, 3] -> [1, 2, 3]
    [1] -> [1]
    1 -> [1]
    """
    if not isinstance(v, list):
        return [v]
    return v


class ACCESS_DECISION:
    IMPLICIT_DENY = 0
    EXPLICIT_DENY = 1
    EXPLICIT_ALLOW = 2
