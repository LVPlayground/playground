# Feature: Logger
There is an incredibly high number of events happening on Las Venturas Playground. For example, each
days we see over half a million shots fired in the streets of Las Venturas, and players drive around
San Andreas for miles and miles.

In order to be able to influence development decisions based on data rather than suspicions, we
plan to gather as many of these statistics as we can to gain advanced analysis abilities. In the
slightly longer term, we will use this data to directly feed data into the server and the website
as well.

We use the [Elastic stack](https://www.elastic.co/) in order to store everything, given that the
volume of data is not appropriate for a conventional database. This feature will communicate with
[logstash](https://www.elastic.co/products/logstash) over a [unix socket]
(https://www.elastic.co/guide/en/logstash/5.0/plugins-inputs-unix.html), and will store the data in
[elasticsearch](https://www.elastic.co/guide/en/logstash/5.0/plugins-outputs-elasticsearch.html).

All events associated with a playing session will be associated with a unique-ish session Id.
