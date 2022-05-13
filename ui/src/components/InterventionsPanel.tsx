import React, {ChangeEvent, useState} from "react";
import { Intervention, ValueId } from "../types/dataModel";
import styled from "styled-components";
import {Card, Button, Input} from "antd";
import {partial} from "lodash";
import InterventionItem from "./InterventionItem";

interface Props {
  interventions: Array<Intervention>;
  addIntervention: (valueId: ValueId) => void;
  updateIntervention: (valueId: ValueId, coeff: number) => void;
  deleteIntervention: (layer: number, dim: number) => void;
  selectIntervention: (valueId: ValueId) => void;
}

function InterventionsPanel(props: Props): JSX.Element {
  const {
    interventions,
    addIntervention,
    updateIntervention,
    deleteIntervention,
    selectIntervention
  } = props;

  const [inputContent, setInputContent] = useState<string>("");

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    setInputContent(e.target.value)
  }

  const isValid = parseInput(inputContent).type === "success";
  const handleAdd = () => {
    const p = parseInput(inputContent);
    if(p.type === "success") {
      addIntervention(p.valueId)
    }
    setInputContent("");
  }

  return (
    <MainLayout 
      title={
        <TitleLayout>
          <TitleText>Interventions</TitleText>
          <ValueInput 
            // validInput={isValid || inputContent === ""}
            placeholder="L12D34"
            value={inputContent}
            onChange={handleInputChange} 
          />
          <AddButton disabled={!isValid} onClick={handleAdd}>Add</AddButton>
        </TitleLayout>
      }
    >
      {
        interventions.map((inter) => (
          <InterventionItem 
            key={`L${inter.layer}D${inter.dim}`}
            intervention={inter}
            deleteIntervention={partial(deleteIntervention, inter.layer, inter.dim)}
            updateIntervention={partial(updateIntervention, inter)}
            select={partial(selectIntervention, inter)}
          />
        ))
      }
    </MainLayout>
  );
}

interface ParseSuccess {
  type: "success";
  valueId: ValueId;
}

interface ParseFailed {
  type: "failed";
  msg: string;
}

type ParseResult = ParseSuccess | ParseFailed;

const parseInput = (str: string): ParseResult => {
  const pattern = /^L(\d+)D(\d+)$/i
  const arr = pattern.exec(str);
  if (arr !== null) {
    const layer = parseInt(arr[1]);
    const dim = parseInt(arr[2]);
    return {
      type: "success",
      valueId: {layer, dim}
    }
  } else {
    return {
      type: "failed",
      msg: "Input must be of form 'L12D43'"
    }
  }
}

const MainLayout = styled(Card).attrs({
  size: "small"
})`
  width: 100%;
  height: 100%;

  &.ant-card .ant-card-body {
    height: 100px;
    overflow-x: auto;
    overflow-y: hidden;
    padding: 2px;

    display:grid;
    grid-auto-flow: column;
    grid-auto-columns: min-content;
    gap: 4px;
  }
`;

const TitleLayout = styled.div`
  display: grid;
  grid-template-columns: min-content 1fr 150px min-content;
  grid-template-rows: 1fr;
  gap: 4px;
  grid-template-areas: 
    "text . input button";

  align-items: center;
`;

const TitleText = styled.span`
  grid-area: text;
`;

const ValueInput = styled(Input)`
  grid-area: input;
`;

// interface VProps {
//   validInput: boolean;
// };
//
// const ValueInput = styled<VProps>(Input)`
//   grid-area: input;
//   border: 0.5px solid ${(props) => props.validInput ? "#40a9ff": "#d73027"};
//   &:hover {
//     border-color: ${(props) => props.validInput ? "#40a9ff": "#d73027"};
//   };

//   &:focus {
//     border-color: ${(props) => props.validInput ? "#40a9ff": "#d73027"};
//   };
// `;



const AddButton = styled(Button).attrs({
  type: "primary",
  size: "small"
})`
  grid-area: button;
  height: 32px;
`;

export default InterventionsPanel;