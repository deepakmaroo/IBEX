from abc import ABC


class DataSourceInterface(ABC):

    def check_uri(self, uri: str): ...
