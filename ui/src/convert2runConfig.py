import argparse
import json

import _jsonnet
import pyhocon
if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--config_path", default='./config_files/gpt2-medium.jsonnet', type=str, help="specify the config file"
    )
    args = parser.parse_args()
    config = pyhocon.ConfigFactory.from_dict(json.loads(_jsonnet.evaluate_file(args.config_path)))
    react_config = {'server_ip':config.server_ip, 'server_port':config.server_port, 'streamlit_ip':config.streamlit_ip, 'streamlit_port':config.streamlit_port}
    with open('./ui/src/runConfig.json', 'w') as fp:
        json.dump(react_config, fp)
    with open('./ui/src/port.txt', 'w') as f:
        f.write(str(config.react_port))

