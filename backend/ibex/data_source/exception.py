class NotALeafNodeException(Exception):
    "Raised when user tries to retrieve data of non-leaf node"
    pass


class NodeNotFoundException(Exception):
    "Raised when requested data-node cannot be found"
    pass
