import React, {useState} from "react";
import styled from "styled-components";
import { Input, Button, Menu, Dropdown } from 'antd';
import AimOutlined from "@ant-design/icons/AimOutlined";
import FormOutlined from "@ant-design/icons/FormOutlined";
import CompassOutlined from "@ant-design/icons/CompassOutlined";

import {partial} from "lodash";
import CaretDownOutlined from "@ant-design/icons/CaretDownOutlined";
import runConfig from "../runConfig.json";


interface Props {
  onRun: (prompt: string) => void;
  onGenerate: (prompt: string, generate_k: Number) => Promise<string>;
  isLoading: boolean;
}


function Prompt(props: Props): JSX.Element {
  const {
    onRun,
    onGenerate,
    isLoading,
  } = props;

  const [promptValue, setPromptValue] = useState<string>("");
  const [isLoadingGenerate, setLoadingGenerate] = useState<boolean>(false);
  const [generate_k, setGenK] = useState<Number>(5);

  const isAnythingLoading = isLoading || isLoadingGenerate;

  const menuOverlay = (
    <Menu>
      <Menu.Item key="0" onClick={partial(setPromptValue, "It was the first time that two")}>
        It was the first time that two
      </Menu.Item>
      <Menu.Item key="1" onClick={partial(setPromptValue, "Toward the end of the video, they sit on a")}>
        Toward the end of the video, they sit on a
      </Menu.Item>
      <Menu.Item key="2" onClick={partial(setPromptValue, "the weather is going to be")}>
        the weather is going to be
      </Menu.Item>
      <Menu.Item key="3" onClick={partial(setPromptValue, "My wife is working as a")}>
        My wife is working as a
      </Menu.Item>

    </Menu>
  );

  async function onGenerateInternal() {
    setLoadingGenerate(true)
    try {
      const generate_text = await onGenerate(promptValue, generate_k);
      setPromptValue(generate_text);
    } finally {
      setLoadingGenerate(false);
    }
  }

  const isEmpty = promptValue.trim() === "";
  const gen_k_menu = (
      <Menu onClick={e => setGenK(parseInt(e.key))}>
        <Menu.Item key={1}>1 token</Menu.Item>
        <Menu.Item key={5}>5 tokens</Menu.Item>
        <Menu.Item key={10}>10 tokens</Menu.Item>
        <Menu.Item key={20}>20 tokens</Menu.Item>
      </Menu>
  );


  return (
    <MainLayout>
      <div id="lmlogo">
        <img src={require('../lmdebugger_logo.svg').default} alt='mySvgImage' />
      </div>
      <ExampleDropdown disabled={isAnythingLoading} overlay={menuOverlay} trigger={['hover']}>
        <Button>Select Example <CaretDownOutlined /></Button>
      </ExampleDropdown>
      {/* <TextInput disabled={isLoading} value={promptValue} onChange={e => onPromptValueChanged(e.target.value)}/> */}
      <TextInput value={promptValue} onChange={e => setPromptValue(e.target.value)} disabled={isLoading} id="prompt_input"/>

      <MainButtons>
        <RunButton disabled={isEmpty || isAnythingLoading} onClick={() => onRun(promptValue)}>
          <span>Trace</span>
          <AimOutlined/>
        </RunButton>
        <GenerateButton
          loading={isLoadingGenerate}
          type="primary"
          disabled={isEmpty || isAnythingLoading}
          overlay={gen_k_menu}
          icon={<span>{generate_k}</span>}
          onClick={() => onGenerateInternal()}>
          <span>Generate</span>
          <FormOutlined/>
        </GenerateButton>
        <ExploreButton onClick={() => window.open(`http://${runConfig.streamlit_ip}:${runConfig.streamlit_port}/`)}>
          <span>Explore</span>
          <CompassOutlined/>
        </ExploreButton>

      </MainButtons>
    </MainLayout>
  );

}

const MainLayout = styled.div`
  display: grid;
  grid-template-columns: 140px 140px auto min-content;
  gap: 8px;
  align-items: center;
  grid-template-areas: 
    "lmlogo examples input button";
`;

const ExampleDropdown = styled(Dropdown)`
  grid-area: examples;
  padding-inline: 1em;
`;

const TextInput = styled(Input)`
  grid-area: input;
`;

const RunButton = styled(Button).attrs({
  type: "primary"
})`
  padding-inline: 1em;
`;

const GenerateButton = styled(Dropdown.Button).attrs({
})`
 padding-left: 3px;
 padding-right: 3px;
`;
const ExploreButton = styled(Button).attrs({
  type: "primary"
})`
  padding-inline: 1em;
`;


const MainButtons = styled.div`
  grid-area: button;
  display: flex;
  flex-direction: row;
  gap: 2px;
`;

export default Prompt;
