/**
 * @NAPIVersion 2.x
 * @NScriptType MapReduceScript
 */


import { EntryPoints } from "N/types"
import * as log from 'N/log'
import * as MSR from "../models/jtc_conciliar_boleto_bank_x_net_MSR"


export const getInputData: EntryPoints.MapReduce.getInputData = () => {
    try {
        return MSR.getInputData()
    } catch (error) {
        log.error("jtc_conciliar_boleto_banco_x_net.getInputData", error)
    }
}

export const map: EntryPoints.MapReduce.map = (ctx: EntryPoints.MapReduce.mapContext) => {
    try {
        MSR.map(ctx)
    } catch (error) {
        log.error("jtc_conciliar_boleto_banco_x_net.map",error)
    }
}