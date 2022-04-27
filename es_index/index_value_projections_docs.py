#!/usr/bin/python3

import argparse
import pickle
from tqdm import tqdm
import pyhocon
import _jsonnet
import json

from elasticsearch.helpers import bulk

from es_index.es_utils import get_esclient


def make_documents(projections_path, es_index_name):
    with open(projections_path, "rb") as fd:
        data = pickle.load(fd)

    doc_id = 0
    for k, v in tqdm(data.items()):
        layer, dim = k
        tokens = [token for _, token, _ in v]
        doc = {
            '_op_type': 'create',
            '_index': es_index_name,
            '_type': '_doc',
            '_id': doc_id,
            '_source': {
                'layer': int(layer),
                'dim': int(dim),
                'tokens': tokens
            }
        }

        doc_id += 1
        yield (doc)


if __name__ == "__main__":
    # Arguments
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--config_path", default='./config_files/gpt2-medium.jsonnet', type=str, help="specify the config file"
    )
    args = parser.parse_args()
    config = pyhocon.ConfigFactory.from_dict(json.loads(_jsonnet.evaluate_file(args.config_path)))

    # Get Index Name
    es_index_name = config.elastic_index

    # Get an ElasticSearch client
    es = get_esclient(config.elastic_ip, config.elastic_port)

    settings = {
        "index": {
            "number_of_shards": 1,
        }
    }
    mappings = {
        "properties": {
            "layer": {
                "type": "integer"
            },
            "dim": {
                "type": "integer"
            },
            "tokens": {
                "type": "text"
            }
        }
    }

    # Create an index
    res = es.indices.create(index=es_index_name, mappings=mappings, settings=settings)

    # Bulk-insert documents into index
    res = bulk(es, make_documents(config.elastic_projections_path, es_index_name))
    doc_count = res[0]

    print("Index {0} is ready. Added {1} documents.".format(es_index_name, doc_count))

