.. _`Backend development`:

===================
Backend development
===================

Backend structure
---------------------------

The IBEX backend is structured into three distinct layers, each represented by a corresponding directory within the ibex Python package:

* endpoints – Defines all HTTP API endpoints. This layer is strictly limited to request handling and routing, and does not contain any business logic.
* core – Serves as an abstraction layer between the endpoints and data_sources layers. Its primary role is to decouple application logic from specific data source implementations, enabling interchangeability. May include minimal logic when necessary.
* data_sources – Implements the core application logic. This layer is responsible for all communication with IDSes and constructs the JSON responses returned to clients.