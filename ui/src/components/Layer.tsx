import React from "react";
import styled from "styled-components";
import { Divider, Tag } from 'antd';
import { LayerPrediction, ValueId } from "../types/dataModel";
import {LabelContainer, PredictionContainer} from "./LabelContainer";


interface Props {
  layer: LayerPrediction;
  onAnalyze: (valueId: ValueId) => void;
  onCopy: (valueId: ValueId) => void;
}


function Layer(props: Props): JSX.Element {
  let {
    predictions_before,
    predictions_after
  } = props.layer;


  return (
      <LayerLayout>
        <LayerTag color="#a55397">Layer {props.layer.layer}</LayerTag>
        <MyDivider orientation="left" orientationMargin="15px">Before:</MyDivider>
        <PredictionContainer predictions={predictions_before}/>
        
        <MyDivider orientation="left"  orientationMargin="15px">Dominant sub-updates:</MyDivider>
        <LabelContainer 
            valueLabels={props.layer.significant_values}
            onAnaylze={props.onAnalyze}
            onCopy={props.onCopy}
        />
        <MyDivider orientation="left" orientationMargin="15px">After:</MyDivider>
        <PredictionContainer predictions={predictions_after}/>


        {/* </SignificantValuesDiv> */}
      </LayerLayout>
  )
}

const LayerLayout = styled.div`

  padding: 10px;
  margin: 2px;
  border: 1px #757373c5 solid;
  border-radius: 5px;

`;

const MyDivider = styled(Divider)`
  &.ant-divider{
    margin: 5px 0;
  }
  & .ant-divider-inner-text {
    font-size: 12pt;
  }
`;

const LayerTag = styled(Tag)`
  font-weight: bold;
  font-size: 12pt;
  padding: 2px 30px;
`;

export const MemoLayer = React.memo(Layer);
