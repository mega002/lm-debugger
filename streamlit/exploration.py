import urllib
import re
import matplotlib.pyplot as plt
from collections import defaultdict, OrderedDict
import streamlit as st
from wordcloud import WordCloud
from dataclasses import dataclass
import pickle5 as pickle
import numpy as np
from operator import itemgetter
import json
import _jsonnet
import argparse
from elasticsearch import Elasticsearch
from utils import (vector_symbol, apply_styling, copyable_value, _escape_latex)


## TODOs
# 1. TODO: right now many control flows lead to the reconciliation of layer, dim and entire_value. there must be 
#          a SINGLE source of truth from which they all derive their value!!

# 2. TODO: make what_to_expand more robust to changes (use enum instead of strings)

# 3. TODO: make one file that imports from both visualization & value_analysis instead of calling value_analysis
#          from exploration


st.set_page_config(
     page_title="LM-Debugger",
     page_icon="🔎",
     menu_items={
         'About': "A Debugger Tool for Transformer-based Language Models."
     }
 )


# consts
MAX_IN_CLUSTER = 10
eps = 1e-9


# helper functions
def _beautify_dict_keys(d):
    keys, values = d.keys(), d.values()

    def _beautify_label(k):
        if k.startswith(('Ġ','Ċ')):
            return " " + k[1:]
        return k
    
    keys = [_beautify_label(k) for k in keys]
    return {k: v for k, v in zip(keys, values)}


def _check_url_if_true(query_params, param_name):
    return query_params.get(param_name, [False])[0] == 'true'


def _random_subset(n, k):
    return np.random.permutation(n)[:k]


def _keep_topk(d, topk):
    return dict(sorted(d.items(), key=itemgetter(1), reverse=True)[:topk])


def _inc_dict(dict1, dict2):
    for k, v in dict2.items():
        dict1[k] += v


def _normalize_label_widths(labels, max_len=20):
    return [("{0:>" + str(max_len) + "}").format(l) if len(l) <= max_len else l[:max_len - 1] + "\u2026" for l in labels]


# main funcs
def get_value_cluster(main_res, value):
    return main_res.value2cluster[value]


def get_value_keywords(main_res, value):
    # we need just the tokens and logits
    return OrderedDict(map(lambda x: (x[1], x[2]), main_res.explorations[value]))


def update_value(*args): 
    layer, dim = map(st.session_state.__getitem__, ('layer', 'dimension'))
    if str.isdigit(dim):
        st.session_state['entire_value'] = f"L{layer}D{dim}"

    
def draw_wc(word_importances):
    fig, ax = plt.subplots()
    word_importances = _beautify_dict_keys(word_importances)
    word_importances_standardized = {k: max(v, 0) for k, v in word_importances.items()}
    wc = WordCloud(background_color='white', include_numbers=True, relative_scaling=1,
                   stopwords=set()).fit_words(word_importances_standardized)
    ax.imshow(wc, interpolation='bilinear')
    ax.axis('off')
    fig.show()
    st.pyplot(fig)


def show_report(word_importances, topk=20, center_graph=True):
    FIG2TOPK_RATIO = .5
    word_importances = _beautify_dict_keys(word_importances)
    words, imp = word_importances.keys(), word_importances.values()
    words, imp = list(words)[:topk], list(imp)[:topk]
    N = len(words)
    ind = list(range(N))[::-1]
    fig, ax = plt.subplots(figsize=(10, FIG2TOPK_RATIO * topk))
    plt.barh(ind, width=imp)
    labels = _normalize_label_widths(words)
    labels = [_escape_latex(l) for l in labels]
    plt.yticks(ind, labels=labels, rotation=0)
    ax.tick_params(labelsize=25)
    plt.xticks([])

    for pos in ['bottom', 'top', 'left', 'right']:
        ax.spines[pos].set_visible(False)
    if center_graph:
        _, graph_col, _ = st.columns([1, 4, 1])
    else:
        graph_col = st
    graph_col.pyplot(fig)


def get_input_keywords(min_value=1, max_value=20):
    with st.form("search_form"):
        num_values = st.slider(label='Number of values to load', min_value=min_value, max_value=max_value, value=5)
        keywords = st.text_input('Insert comma separated keywords', key='keywords')
        st.form_submit_button("Search")
    kw = [x.lower() for x in keywords.split(",") if x.strip()]
    return kw, num_values


def show_values_for_keywords(es, elastic_index, keywords, num_values):
    keywords = [w.strip() for w in keywords]
    st.subheader(f"searching for \"{', '.join(keywords)}\"")
    kw = [f"{w} Ġ{w} Ċ{w}" for w in keywords if w]
    query = {"match": {"tokens": {"query": " ".join(kw)}}}
    result = es.search(index=elastic_index, query=query, size=num_values)["hits"]["hits"]
    if result:
        for value in result:
            source = value['_source']
            layer, dim, tokens = source['layer'], source['dim'], source['tokens']
            copyable_value(layer, dim)

            tokens = [t[1:] if t.startswith(("Ġ", "Ċ")) else t for t in tokens]
            tokens = [f"<span class='token-font'>{t}</span>" if t.lower() in keywords else t for t in tokens]
            st.write(", ".join(tokens), unsafe_allow_html=True)
            st.write("\n")
    elif [k for k in kw if k.strip()]:
        st.write("No results")


def show_value_visualizations(main_res, value):
    if btn_visualize or _check_url_if_true(query_params, 'visualize'):
        word_importances = get_value_keywords(main_res, value)
        layer, dim = value
        st.subheader(f"L{layer}D{dim}")
        copyable_value(layer, dim)
        draw_wc(word_importances)
        show_report(word_importances, topk=40)

    if btn_cluster or _check_url_if_true(query_params, 'visualize_cluster'):
        cluster_idx = get_value_cluster(main_res, value)
        my_cluster = main_res.all_clusters[cluster_idx]
        global_word_importances = defaultdict(float)

        st.subheader(f"Cluster {cluster_idx}")
        st.caption(f"{len(my_cluster)} value vectors in cluster.")
        cluster_wc = st.container()

        for cnt, val_idx in enumerate(_random_subset(n=len(my_cluster), k=MAX_IN_CLUSTER)):
            if cnt % 2 == 0:
                cluster_cols = st.columns([1, 1])
            friend_value = my_cluster[val_idx]
            friend_layer, friend_dim = friend_value
            with cluster_cols[cnt % 2]:
                copyable_value(friend_layer, friend_dim)
                word_importances = get_value_keywords(main_res, friend_value)
                importance_norm = sum([max(val, eps) for val in word_importances.values()])
                normalized_word_importances = {k: max(v, eps) / importance_norm for k, v in word_importances.items()}
                show_report(word_importances, center_graph=False)
            _inc_dict(global_word_importances, word_importances)

        global_word_importances = defaultdict(float)
        for friend_value in my_cluster:
            word_importances = get_value_keywords(main_res, friend_value)
            _inc_dict(global_word_importances, word_importances)
        with cluster_wc:
            draw_wc(_keep_topk(global_word_importances, topk=30))


class LocalResources(object):
    what_to_expand: str = 'kw'
    
    
class MainResources(object):
    pass


@st.experimental_singleton
def get_main_resources(json_config):
    model_json = json.loads(_jsonnet.evaluate_file(json_config))
    main_res = MainResources()
    main_res.all_clusters = pickle.load(open(model_json['streamlit_cluster_to_value_file_path'], 'rb'))
    main_res.value2cluster = pickle.load(open(model_json['streamlit_value_to_cluster_file_path'], 'rb'))
    main_res.explorations = pickle.load(open(model_json['elastic_projections_path'], 'rb'))
    main_res.num_layers = model_json['num_layers']
    main_res.es_path = f"{model_json['elastic_ip']}:{model_json['elastic_port']}"
    main_res.es_index = model_json['elastic_index']
    return main_res


# main
parser = argparse.ArgumentParser()
parser.add_argument("--config_path", type=str, default="../config_files/gpt2-medium.jsonnet")
cmdline_args = parser.parse_args()

json_config = cmdline_args.config_path
main_res = get_main_resources(json_config)
local_res = LocalResources()
query_params = st.experimental_get_query_params()

if 'entire_value' in st.session_state:
    entire_value = st.session_state['entire_value']
    match = re.match(r'^L(\d+)D(\d+)$', entire_value)
    if match is not None:
        layer, dimension = match.group(1), match.group(2)
        st.session_state['layer'] = int(layer)
        st.session_state['dimension'] = dimension

if 'keywords' in query_params:
    st.session_state['keywords'] = query_params['keywords'][0]

if 'L' in query_params and 'D' in query_params:
    query_L, query_D = int(query_params['L'][0]), int(query_params['D'][0])
    st.session_state['layer'] = query_L
    st.session_state['dimension'] = str(query_D)
    st.session_state['entire_value'] = f'L{query_L}D{query_D}'
else:
    query_L, query_D = None, None

    
with st.sidebar:
    st.sidebar.image("/home/morp/lm_debugger/img/lmdebugger_logo.png", width=140)
    st.header('Value Search by Keyword')
    kw, num_values = get_input_keywords()
    if (not kw or st.session_state.get('btn_visualize', False) or st.session_state.get('btn_cluster', False)
            or 'L' in query_params):
        local_res.what_to_expand = "visualization"

    st.header("Visualization")
    col1, col2, col3, col4 = st.columns([3, 3, 1, 4])
    layer = col1.selectbox("Layer", options=range(main_res.num_layers), on_change=update_value, key='layer')
    dimension = col2.text_input("Dimension", key='dimension', on_change=update_value)
    col3.write("<sub>OR</sub>", unsafe_allow_html=True)
    entire_value = col4.text_input("Value", key='entire_value')

    btn_col1, _, btn_col2 = st.columns([2.5, .55, 2.5])
    btn_visualize = btn_col1.button("Visualize Value", key='btn_visualize')
    btn_cluster = btn_col2.button("Visualize Cluster", key='btn_cluster')

if kw:
    expand = local_res.what_to_expand == "kw"
    with st.expander("Values by Keywords", expanded=expand):
        es = Elasticsearch(main_res.es_path)
        apply_styling()
        show_values_for_keywords(es, main_res.es_index, kw, num_values)

if str.isdigit(dimension) or entire_value != "":
    expand = local_res.what_to_expand != "kw"
    with st.expander("Visualization", expanded=expand):
        if entire_value != "":
            match = re.match(r'^L(\d+)D(\d+)$', entire_value)
            if match is None:
                st.write("CANNOT PARSE INPUT VALUE!!!")
            else:
                layer, dimension = match.group(1), match.group(2)

            value = (int(layer), int(dimension))
            show_value_visualizations(main_res, value)

st.experimental_set_query_params()
