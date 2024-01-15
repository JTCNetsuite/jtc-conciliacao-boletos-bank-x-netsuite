/**
 * @NAPIVersion 2.x
 * @NScriptType Suitelet
 */


import {EntryPoints} from 'N/types'
import * as log from 'N/log'
import * as MSR from '../models/jtc_page_boleto_bank_x_net_MSR'


export const onRequest: EntryPoints.Suitelet.onRequest = (ctx: EntryPoints.Suitelet.onRequestContext) => {
    try {
        
        if (ctx.request.method == "GET") {
            MSR.onRequest(ctx)
        }

    } catch (error) {
        log.error("jtc_conciliar_boletos_banco_x_net_ST.onRequest", error)
    }
}