class IbexException(Exception):
    "IBEX specific exception. Used as a parent for more specific exceptions"

    def __init__(self, message: str, code: int):
        self.code = code
        super().__init__(message)


class ResultTooLong(IbexException):
    "Raised when generated result is too long be usefull"

    pass


class NotALeafNodeException(IbexException):
    "Raised when user tries to retrieve data of non-leaf node"

    pass


class NotAnArrayException(IbexException):
    "Raised when requested data-node is not an array, but it should be (when getting array summary)"

    pass


class NodeNotFoundException(IbexException):
    "Raised when requested data-node cannot be found"

    pass


class DifferentTypesException(IbexException):
    "Raised when requested multiple values are not the same type"

    pass
