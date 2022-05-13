import React from "react";
import { Intervention } from "../types/dataModel";
import {Switch, Button, Typography} from "antd"
import styled from "styled-components";
import CloseCircleOutlined from "@ant-design/icons/CloseCircleOutlined"
import { ScanOutlined } from '@ant-design/icons';

const {Text} = Typography;

interface Props {
  intervention: Intervention;
  updateIntervention : (coeff: number) => void;
  deleteIntervention : () => void;
  select: () => void;
}

function InterventionItem(props: Props):JSX.Element {
  const {
    intervention,
    updateIntervention,
    deleteIntervention,
    select
  } = props;

  const {
    layer,
    dim,
    desc,
    coeff
  } = intervention;

  const isOn = coeff > 0.5;

  const handleChange = (checked: boolean) => {
    if (checked) {
      updateIntervention(1.0)
    } else {
      updateIntervention(0.0)
    }
  }

  const actualDesc = desc !== undefined && desc !== "" ? desc : `L${layer}D${dim}` 
  const useEllipsis = actualDesc.length > 10

  return (
    <MainLayout checked={isOn}>
      <Label onClick={select}>
        <ScanOutlined />
        <Text strong 
          style={useEllipsis ? { width: 55 } : undefined}
          ellipsis={useEllipsis ? { tooltip: true } : false}>{actualDesc}</Text>
      </Label>
      <CoeffToggle checked={isOn} onChange={handleChange}/>
      <CloseButton onClick={deleteIntervention}>
          <CloseCircleOutlined />
      </CloseButton>
    </MainLayout>
  );
}

interface Toggle {
  checked: boolean;
}

const MainLayout = styled.div<Toggle>`
  width: 100%;
  height: 82px;
  border: 0.5px solid ${(props) => props.checked ? "#7fbc41": "#d73027"};
  border-radius: 4px;
  background-color: ${(props) => props.checked ? "#e6f5d0": "#f46d43"};
  padding: 4px;

  display: grid;
  grid-template-columns: 1fr;
  justify-items: center;
  grid-template-rows: 1fr 1fr;
  gap: 4px;

  grid-template-areas: 
    "label  close"
    "control control";
`;

const CloseButton = styled(Button).attrs({
  type: "link"
})`
  grid-area: close;
  margin-top: -10px;
  margin-right: -16px;
  justify-self: end;
  align-self: start;
`;

const Label = styled(Button)`
  grid-area: label;
  font-weight: bold;
  font-family: monospace;

`;

const CoeffToggle = styled(Switch)`
  grid-area: control;
`;

export default InterventionItem;
