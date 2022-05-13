import React from "react";
import {Empty, Card, Alert, Spin } from "antd";
import { LayerPrediction, ValueId } from "../types/dataModel";
import styled from "styled-components";
import {MemoLayer} from "./Layer"

interface Props {
  layers?: Array<LayerPrediction>;
  setSelectedValueId: (v: ValueId) => void;
  addIntervention: (valueId: ValueId) => void;
  isLoading: boolean;
  errorMessage?: string;
}

function LayersPanel(props: Props): JSX.Element {
  const {
    layers,
    setSelectedValueId,
    addIntervention,
    isLoading,
    errorMessage,
  } = props;
  
  let contentRender: React.ReactNode = <></>;
  if (isLoading) {
    contentRender = <Spin style={{margin: "auto auto"}} tip="Loading prediction" />;
  } else if (errorMessage !== undefined) {
    contentRender = <Alert type="error">{errorMessage}</Alert>
  } else if (layers === undefined){
    contentRender = <Empty description="Run a query to see the predicted layers"/>
  } else {
    contentRender = (
      layers.map((item) => (
         <MemoLayer 
            key={`layer_${item.layer}`}
            layer={item} 
            onAnalyze={valueId => setSelectedValueId(valueId)}
            onCopy={addIntervention} 
          />
      ))
    )
  }

  return (
    <MainLayout title="Layers">
      {contentRender} 
    </MainLayout>
  );
}

const MainLayout = styled(Card).attrs({
  size: "small"
})`
  width: 100%;
  height: 100%;

  &.ant-card .ant-card-body {
    height: calc(100vh - 236px);
    overflow-x: hidden;
    overflow-y: auto;
    padding: 2px;

    display: grid;
    justify-items: center;
  }
`;

export default LayersPanel