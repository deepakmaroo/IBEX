class NotALeafNodeException(Exception):
    "Raised when user tries to retrieve data of non-leaf node"

    pass


class NotAnArrayException(Exception):
    "Raised when requested data-node is not an array, but it should be (when getting array summary)"

    pass


class NodeNotFoundException(Exception):
    "Raised when requested data-node cannot be found"

    pass
