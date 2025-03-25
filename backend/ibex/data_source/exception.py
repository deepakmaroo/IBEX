class IbexException(Exception):
    "IBEX specific exception. Used as a parent for more specific exceptions"

    def __init__(self, message: str, code: int = 500):
        self.code = code
        super().__init__(message)


class NodeNotFoundException(IbexException):
    "Raised when requested data-node cannot be found"

    def __init__(self, message: str, code: int = 404):
        self.code = code
        super().__init__(message, code)


class IdsNotFoundException(IbexException):
    "Raised when requested IDS cannot be found"

    def __init__(self, message: str, code: int = 404):
        self.code = code
        super().__init__(message, code)


class ResultTooLong(IbexException):
    "Raised when generated result is too long be useful"

    def __init__(self, message: str, code: int = 460):
        self.code = code
        super().__init__(message, code)


class NotALeafNodeException(IbexException):
    "Raised when user tries to retrieve data of non-leaf node"

    def __init__(self, message: str, code: int = 461):
        self.code = code
        super().__init__(message, code)


class NotAnArrayException(IbexException):
    "Raised when requested data-node is not an array, but it should be (when getting array summary)"

    def __init__(self, message: str, code: int = 462):
        self.code = code
        super().__init__(message, code)


class DifferentTypesException(IbexException):
    "Raised when requested multiple values are not the same type"

    def __init__(self, message: str, code: int = 463):
        self.code = code
        super().__init__(message, code)
