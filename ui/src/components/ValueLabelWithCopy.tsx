import React from "react";
import styled from "styled-components";
import { Button, Tag, Tooltip } from 'antd';
import { DownSquareOutlined, ScanOutlined } from '@ant-design/icons';
import { ScoredValue, ValueId } from "../types/dataModel";
import { Typography } from 'antd';

const {Text} = Typography

interface Props {
    scoredValue: ScoredValue,
    onAnalyze: (valueId: ValueId) => void;
    onCopy: (valueId: ValueId) => void;
}

function ValueLabelWithCopy(props: Props): JSX.Element {
    
    const {
        scoredValue, 
        onAnalyze,
        onCopy
    } = props;

    const {
        layer,
        dim,
        desc,
        score
    } = scoredValue;
    const actualDesc = desc !== undefined && desc !== "" ? desc : `L${layer}D${dim}` 
    const useEllipsis = actualDesc.length > 10

    return (
        <LabelLayout>
            <MainButton onClick={() => onAnalyze(scoredValue)}>
            <ScanOutlined/>
            
            <Text strong 
                style={useEllipsis ? { width: 55 } : undefined}
                ellipsis={useEllipsis ? { tooltip: true } : false}>{actualDesc}</Text>
            <TagInButton color="#A6ABAB">{ score.toFixed(2)}</TagInButton>

            </MainButton>
            <Tooltip title="Send to interventions">
                <CopyButton onClick={() => onCopy(scoredValue)} >
                    <CopyIcon />
                </CopyButton>
            </Tooltip>
        </LabelLayout>
    );
}

const CopyIcon = styled(DownSquareOutlined)`
    font-size: 15px;
    color: #717D7E;
`;

const LabelLayout = styled.div`

    width: 170px;
    max-width: 170px;
    min-width: 170px;
    display: flex;
    flex-direction: row;
    flex-wrap: nowrap;
    gap: 0;

    & .ant-btn-icon-only {
        padding-left: 0px;
        padding-right: 0px;
        width: 30px;
    }

`;

const MainButton = styled(Button)`
    padding: 0 5px;
`;

const CopyButton = styled(Button)`
    padding: 3px;
    margin-left: -1px;
`;

const TagInButton = styled(Tag)`
    margin-left: 1.0em;
    margin-right: 0.2em;
    font-size: 8pt;
    line-height: 8pt;
    padding: 0px 2px;
    font-weight: normal;
`;

export default ValueLabelWithCopy;
