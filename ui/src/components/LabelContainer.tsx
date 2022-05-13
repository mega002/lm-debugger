import React from "react";
import styled from "styled-components";
import ValueLabelWithCopy from "./ValueLabelWithCopy"
import TokenLabel from "./TokenLabel";
import { ScoredValue, Prediction, ValueId } from "../types/dataModel";



interface Props {
    valueLabels: Array<ScoredValue>;
    onAnaylze: (valueId: ValueId) => void;
    onCopy: (valueId: ValueId) => void;
}

export function LabelContainer(props: Props): JSX.Element {
    const labels = props.valueLabels.map(label => 
        <ValueLabelWithCopy 
            scoredValue={label}
            key={`L${label.layer}D${label.dim}`} 
            onAnalyze={props.onAnaylze}
            onCopy={props.onCopy} 
        />
    );
    return (
        <ContainerLayout>
            {labels}
        </ContainerLayout>
    );
}

interface PredProps {
    predictions: Array<Prediction>;
}

export function PredictionContainer(props: PredProps) : JSX.Element {
    const predictions = props.predictions.map((pred, idx) => (
       <TokenLabel key={idx.toString() + pred.token} predToken={pred} isFirst={idx === 0}/>
    ));

    return (
        <ContainerLayout>
            {predictions}
        </ContainerLayout>
    );
}

const ContainerLayout = styled.div`
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    justify-content: flex-start;
    align-items: flex-start;
    gap: 4px;
    padding-left: 1em;
    
`;
