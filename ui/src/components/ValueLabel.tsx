import React from "react";
import { Button,  Tag } from 'antd';
import { ScanOutlined } from '@ant-design/icons';
import { ScoredValue } from "../types/dataModel";

interface Props {
    scoredValue: ScoredValue,
    onAnalyze: (layer: number, dim: number) => void;
  }

function ValueLabel(props: Props) : JSX.Element {
    const {
        scoredValue, 
        onAnalyze
    } = props;

    const {
        layer,
        dim,
        score
    } = scoredValue;

    return (
        <Button onClick={() => onAnalyze(layer, dim)}>
            <ScanOutlined/>
            <span>L{scoredValue.layer}D{scoredValue.dim}</span>
            <Tag color="blue">{score}</Tag>
        </Button>
    );
}

export default ValueLabel;