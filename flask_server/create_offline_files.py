import argparse
import json
import os
import pickle
import warnings

import _jsonnet
import numpy as np
import pyhocon
import torch
from sklearn.cluster import AgglomerativeClustering
from tqdm import tqdm
from transformers import GPT2LMHeadModel, GPT2Tokenizer

warnings.filterwarnings('ignore')


def get_all_projected_values(model):
    logits = []
    for i in tqdm(range(model.config.n_layer)):
        layer_logits = torch.matmul(model.transformer.wte.weight, model.transformer.h[i].mlp.c_proj.weight.T).T
        logits.append(layer_logits)

    logits = torch.vstack(logits)
    return logits.detach().cpu().numpy()


def create_elastic_search_data(path, model, model_name, tokenizer, top_k):
    if os.path.isfile(path):
        with open(path, 'rb') as handle:
            dict_es = pickle.load(handle)
            return dict_es
    d = {}
    inv_d = {}
    cnt = 0
    total_dims = model.transformer.h[0].mlp.c_proj.weight.size(0)
    for i in range(model.config.n_layer):
        for j in range(total_dims):
            d[cnt] = (i, j)
            inv_d[(i, j)] = cnt
            cnt += 1
    dict_es = {}
    logits = get_all_projected_values(model)
    for i in tqdm(range(model.config.n_layer)):
        for j in tqdm(range(total_dims), leave=False):
            k = (i, j)
            cnt = inv_d[(i, j)]
            ids = np.argsort(-logits[cnt])[:top_k]
            tokens = [tokenizer._convert_id_to_token(x) for x in ids]
            dict_es[k] = [(ids[b], tokens[b], logits[cnt][ids[b]]) for b in range(len(tokens))]
    with open(path, 'wb') as handle:
        pickle.dump(dict_es, handle, protocol=pickle.HIGHEST_PROTOCOL)
    return dict_es


def get_all_values(model):
    values = []
    for i in tqdm(range(model.config.n_layer)):
        layer_logits = model.transformer.h[i].mlp.c_proj.weight
        values.append(layer_logits)
    values = torch.vstack(values)
    return values


def cosine_distance_torch(x1, x2=None, eps=1e-8):
    x2 = x1 if x2 is None else x2
    w1 = x1.norm(p=2, dim=1, keepdim=True)
    w2 = w1 if x2 is x1 else x2.norm(p=2, dim=1, keepdim=True)
    return 1 - torch.mm(x1, x2.t()) / (w1 * w2.t()).clamp(min=eps)


def get_predicted_clusters(n, cosine_mat):
    clustering = AgglomerativeClustering(n_clusters=n, affinity='precomputed', linkage='complete')
    predicted = clustering.fit(cosine_mat)
    predicted_clusters = predicted.labels_
    return predicted_clusters


def create_streamlit_data(path_cluster_to_value, path_value_to_cluster, model, model_name, num_clusters):
    if os.path.isfile(path_cluster_to_value) and os.path.isfile(path_value_to_cluster):
        return
    d = {}
    inv_d = {}
    cnt = 0
    total_dims = model.transformer.h[0].mlp.c_proj.weight.size(0)
    for i in range(model.config.n_layer):
        for j in range(total_dims):
            d[cnt] = (i, j)
            inv_d[(i, j)] = cnt
            cnt += 1
    values = get_all_values(model).detach().cpu()
    cosine_mat = cosine_distance_torch(values).detach().cpu().numpy()
    predicted_clusters = get_predicted_clusters(num_clusters, cosine_mat)
    clusters = {i: [] for i in range(num_clusters)}
    for i, x in enumerate(predicted_clusters):
        clusters[x].append(d[i])
    inv_map = {vi: k for k, v in clusters.items() for vi in v}
    with open(path_cluster_to_value, 'wb') as handle:
        pickle.dump(clusters, handle, protocol=pickle.HIGHEST_PROTOCOL)
    with open(path_value_to_cluster, 'wb') as handle:
        pickle.dump(inv_map, handle, protocol=pickle.HIGHEST_PROTOCOL)
    return


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--config_path", default='./config_files/gpt2-medium.jsonnet', type=str, help="specify the config file"
    )
    args = parser.parse_args()
    config = pyhocon.ConfigFactory.from_dict(json.loads(_jsonnet.evaluate_file(args.config_path)))
    model = GPT2LMHeadModel.from_pretrained(config.model_name)
    device = config.device
    model.to(device)
    tokenizer = GPT2Tokenizer.from_pretrained(config.model_name)
    _ = create_elastic_search_data(config.elastic_projections_path, model, config.model_name, tokenizer,
                                   config.top_k_for_elastic)
    create_streamlit_data(config.streamlit_cluster_to_value_file_path, config.streamlit_value_to_cluster_file_path,
                          model, config.model_name, config.num_clusters)
