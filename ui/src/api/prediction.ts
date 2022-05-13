import {PredictionParams, NetworkPrediction, ValueId, ValueInterpretation, GenerationOutput} from "../types/dataModel";
import runConfig from "../runConfig.json";

export async function generate(params: PredictionParams): Promise<GenerationOutput> {
  const response = await fetch(
    `http://${runConfig.server_ip}:${runConfig.server_port}/generate`,
    {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        prompt: params.prompt,
        generate_k: params.generate_k,
        interventions: params.interventions ?? []
      })
    }
  )

  const responseJson = await response.json();
  return responseJson
}

export async function predict(params: PredictionParams): Promise<NetworkPrediction> {

  const response = await fetch(
    `http://${runConfig.server_ip}:${runConfig.server_port}/get_data`,
    {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        prompt: params.prompt,
        interventions: params.interventions ?? []
      })
    }
  )
  
  const responseJson = await response.json();
  
  // No intervention information is sent when no interventions is provided
  const result = responseJson.intervention ?? responseJson.response;
  // const resultWithNames = addNamesToValues(result)
  return result
  
}

export function getValueNamesFromCookies(): Array<ValueId> {
  // Search cookies
  const cookieData = document.cookie.split(';');
  const newValueIds = cookieData.filter(cookie=> cookie.trim().startsWith("new_name_L"))
  .map(cookie => {
    const pair = cookie.split("=")
    const _valueId = pair[0].trim()
    const desc = pair[1].trim()
    const [before_D, after_D] = _valueId.split("D")
    const layer = parseInt(before_D.replace("new_name_L", ""))
    const dim = parseInt(after_D)
    const valueId: ValueId = {layer, dim, desc}
    return valueId;
  })
  return newValueIds;
}


export function getValueInterpretation(params: ValueId): [Promise<ValueInterpretation>, () => void] {
  const controller = new AbortController();

  const responsePromise = fetch(
    `http://${runConfig.server_ip}:${runConfig.server_port}/get_projections/layer/${params.layer}/dim/${params.dim}`,
    {
      signal: controller.signal
    }
  ).then((r) => {
    return r.json();
  });

  return [responsePromise, () => controller.abort()];
}
