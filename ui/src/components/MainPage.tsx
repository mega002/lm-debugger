import React, {useState} from "react";
import { hot } from "react-hot-loader";
import Prompt from "./Prompt";
import {NetworkPrediction, Intervention, ValueId} from "../types/dataModel";
import {predict, generate, getValueNamesFromCookies} from "../api/prediction";
import LayersPanel from "./LayersPanel";
import ValueDetailsPanel from "./ValueDetailsPanel";
import InterventionsPanel from "./InterventionsPanel";
import styled, {css} from "styled-components";

function MainPage(): JSX.Element {

  const [prediction, setPrediction] = useState<NetworkPrediction | undefined>(undefined);
  const [interventions, setInterventions] = useState<Array<Intervention>>([]);
  const [selectedValueId, setSelectedValueId] = useState<ValueId | undefined>(undefined);
  const [isLoadingPrediction, setLoadingPrediction] = useState<boolean>(false);
  const [predictionError, setPredictionError] = useState<string | undefined>(undefined);



  // ----------------------------------- //
  // Intervention State Update functions //
  // ----------------------------------- //
  function addIntervention(valueId: ValueId) {
    if(!hasIntervention(valueId)){
      setInterventions([{...valueId, coeff: 0.0}, ...interventions])
    }
  }

  function updateIntervention(valueId: ValueId, coeff: number){
    const {layer, dim, desc} = valueId;
    setInterventions(interventions.map(
      (inter) => {
        if (inter.layer === layer && inter.dim === dim) {
          return {
            layer,
            dim,
            desc,
            coeff
          };
        }
        return inter;
      }
    ))
  }

  function deleteIntervention (l: number, d: number){
    setInterventions(interventions.filter(({layer, dim}) => (layer !== l) || (dim !== d)))
  }

  function hasIntervention (valueId: ValueId) {
    return interventions.filter(({layer, dim}) => (layer === valueId.layer) && (dim === valueId.dim)).length > 0
  }

  function selectIntervention(valueId: ValueId): void {
    setSelectedValueId(valueId)
  }

  async function handleGenerate(prompt: string, generate_k: Number): Promise<string> {
    setPredictionError(undefined);
    try {
      const result = await generate({prompt, interventions, generate_k});
      const {generate_text} = result;
      return generate_text;
    }catch(e) {
      setPredictionError("Failed generation");
      return prompt;
    }
  }

  function addNamesToValues(prediction: NetworkPrediction) : NetworkPrediction {
    // One hell of a side effect...
    const valueIds = getValueNamesFromCookies();
    const {prompt, layers} = prediction;  
  
  
    const new_layers =  [...layers]
    valueIds.forEach(valueId => {
      const {layer, dim} = valueId;
      const values = new_layers[layer].significant_values;
      values.filter(v=> v.dim === dim && v.layer === layer).forEach(value => value.desc = valueId.desc)
    })
    return {
      prompt,
      layers: new_layers
    }
  }


  async function handleRun(prompt: string){
    setLoadingPrediction(true);
    setPredictionError(undefined);
    try {
      const result = await predict({prompt, interventions, generate_k: 1});
      const resultWithNames = addNamesToValues(result);
      setPrediction(resultWithNames);
    }catch(e) {
      setPredictionError("Failed prediction");
    } finally {
      setLoadingPrediction(false);
    }
  }


  function handleValueRename(valueId: ValueId, newName: string) {
    
    document.cookie = `new_name_L${valueId?.layer}D${valueId?.dim}=${newName};`;
    if (prediction === undefined) {
      return;
    } 
    
    const newPrediction = addNamesToValues(prediction)
    const namedValueIds = getValueNamesFromCookies()
    const namedInterventions = interventions.map( inter => {
      const matches = namedValueIds.filter(v => v.layer == inter.layer && v.dim == inter.dim)
      if (matches.length == 0) {
        return inter
      }
      const matched = matches[0]
      return {...inter, desc: matched.desc}
    });
        
    setInterventions(namedInterventions)
    setPrediction(newPrediction)
    if (selectedValueId?.layer == valueId.layer && selectedValueId?.dim == valueId.dim) {        
      const {layer, dim} = valueId
      const namedValueId = {layer, dim, desc: newName}
      setSelectedValueId(namedValueId);
    }
    
  }

  const detailsVisible = selectedValueId !== undefined;

  return (
    <MainLayout detailsVisible={detailsVisible}> 
      <PromptArea>
        <Prompt 
          onRun={handleRun}
          onGenerate={handleGenerate}
          isLoading={isLoadingPrediction}           
        />
      </PromptArea>
      <ValueDetailsArea detailsVisible={detailsVisible}>
        <ValueDetailsPanel valueId={selectedValueId} onValueRename={handleValueRename} />
      </ValueDetailsArea>
      <LayersViewArea>
        <LayersPanel 
          layers={prediction?.layers}
          setSelectedValueId={setSelectedValueId}
          addIntervention={(valueId) => addIntervention(valueId)} 
          isLoading={isLoadingPrediction}
          errorMessage={predictionError}
        />
      </LayersViewArea>
      <InterventionArea>
        <InterventionsPanel 
          interventions={interventions}
          addIntervention={(valueId: ValueId) => addIntervention(valueId)}  
          deleteIntervention={(l, d) => deleteIntervention(l, d)}
          updateIntervention={(v, c) => updateIntervention(v, c)}
          selectIntervention={(v) => selectIntervention(v)}
        />
      </InterventionArea>
    </MainLayout>
  )
}

interface DetailsVisibleProps {
  detailsVisible: boolean;
}

const withDetails = css`
  grid-template-columns: 5fr 1fr;
`;

const withoutDetails = css`
  grid-template-columns: 1fr 0px;
`;

const MainLayout = styled.div<DetailsVisibleProps>`
  width: 100%;
  height: 100%;

  background-color: #dce0e6;

  padding: 4px;

  display: grid;
  grid-template-columns: 2fr 1fr;
  grid-template-rows: min-content 1fr 140px;

  grid-template-areas: 
    "prompt  details"
    "layers  details"
    "inter   inter";

  ${(props) => props.detailsVisible ? withDetails : withoutDetails}
`;

const PromptArea = styled.div`
  grid-area: prompt;
  padding: 2px;
`;

const ValueDetailsArea = styled.div<DetailsVisibleProps>`
  grid-area: details; 
  visibility: ${(props) => props.detailsVisible ? "visible" : "hidden"};
  padding: ${(props) => props.detailsVisible ? "2px" : "0px"};
`;

const LayersViewArea = styled.div`
  grid-area: layers;  
  padding: 2px;
`;

const InterventionArea = styled.div`
  grid-area: inter;
  padding: 2px;
`;

export default hot(module)(MainPage);
