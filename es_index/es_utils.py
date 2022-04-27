
import boto3

from requests_aws4auth import AWS4Auth
from elasticsearch import Elasticsearch, RequestsHttpConnection


def get_esclient(host, port, region=None):
    if region is not None:
        service = 'es'
        credentials = boto3.Session().get_credentials()
        awsauth = AWS4Auth(credentials.access_key, credentials.secret_key, region, service)
        return Elasticsearch(
            hosts=[{'host': host, 'port': 443}],
            http_auth=awsauth,
            use_ssl=True,
            verify_certs=True,
            connection_class=RequestsHttpConnection,
            retries=3,
            timeout=60
        )
    else:
        return Elasticsearch(hosts=[{"host": host, "port": port}], retries=3, timeout=60)

