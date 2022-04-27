#!/bin/bash
CONFIG_PATH="./config_files/gpt2-medium.jsonnet";
python ui/src/convert2runConfig.py --config_path "${1:-$CONFIG_PATH}";
react_port="$(cat ui/src/port.txt)";
python flask_server/app.py --config_path "${1:-$CONFIG_PATH}" & P1=$!
streamlit run streamlit/exploration.py -- --config_path "${1:-$CONFIG_PATH}" & P2=$!
cd ui;
PORT=${react_port} yarn start & P3=$!
wait $P1 $P2 $P3