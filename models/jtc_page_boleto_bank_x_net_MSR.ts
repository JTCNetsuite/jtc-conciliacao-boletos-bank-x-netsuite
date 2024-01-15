/**
 * @NAPIVersion 2.x
 * @NModuleScope public
 */


import { EntryPoints } from "N/types"
import * as log from "N/log"
import * as https from 'N/https'
import * as search from "N/search"
import { constante as CTS } from "../module/jtc_conciliar_boleto_CTS"

export const onRequest = (ctx: EntryPoints.Suitelet.onRequestContext) => {
    try {

        const data = getIntergrcaoBB()
        const token = getAccessToken(data.url_token, data.authorization)
        const authObj = token.body.token_type + " " + token.body.access_token

        const headerArr = {};
        headerArr['Authorization'] = authObj;
        headerArr['Accept'] = 'application/json';


        const request = https.get({
            url: 'https://api.bb.com.br/cobrancas/v2/boletos?gw-dev-app-key=4a5e515a85aa0cb8a74b71646d5ec025&indicadorSituacao=B&agenciaBeneficiario=3221&contaBeneficiario=19570&dataInicioMovimento=12.12.2023&dataFimMovimento=12.12.2023&codigoEstadoTituloCobranca=6',
            headers: headerArr
        })
        // const request2 = https.get({
        //     url: 'https://api.bb.com.br/cobrancas/v2/boletos?gw-dev-app-key=4a5e515a85aa0cb8a74b71646d5ec025&indicadorSituacao=B&agenciaBeneficiario=3221&contaBeneficiario=19570&dataInicioMovimento=12.12.2023&dataFimMovimento=12.12.2023&codigoEstadoTituloCobranca=6&indice=300',
        //     headers: headerArr
        // })
        const boletos = JSON.parse(request.body).boletos

        

        const nossosNum = []

        for (var i=0; i < boletos.length; i++) {
            const urlBoletoIndividual = `https://api.bb.com.br/cobrancas/v2/boletos/${boletos[i].numeroBoletoBB}?gw-dev-app-key=4a5e515a85aa0cb8a74b71646d5ec025&numeroConvenio=2202864`
            
            const nfBoleto = JSON.parse(https.get({
                url: urlBoletoIndividual,
                headers: headerArr
            }).body).numeroTituloCedenteCobranca

            nossosNum.push(boletos[i].numeroBoletoBB)

            log.debug(boletos[i].numeroBoletoBB,  nfBoleto)

            // const searchParcela = search.create({
            //     type: CTS.PARCELA_CNAB.ID,
            //     filters: ['custrecord_dk_cnab_nosso_numero',],
            //     columns: [
            //         search.createColumn({name: CTS.PARCELA_CNAB.NOSSO_NUMERO}),
            //         search.createColumn({name: CTS.PARCELA_CNAB.PAGO}),
            //         search.createColumn({name: CTS.PARCELA_CNAB.TRANSACTION}),
            //         search.createColumn({name: 'custrecord_dk_cnab_mensagem_bloqueto'}),
            //         search.createColumn({name: 'custrecord_dk_cnab_num_titbeneficiario'}),
            //     ]
            // }).run().getRange({start: 0, end: range})
        }
        
        // const boletos2 = JSON.parse(request2.body).boletos
        // for (var j=0; j < boletos2.length; j++) {
        //     nossosNum.push(boletos2[j].numeroBoletoBB)
        //     boletos.push(boletos2[j])
        // 


        // const html = htmlPage(filters, nossosNum.length)



        ctx.response.write('ok')


    } catch (error) {
        log.error("jtc_page_boleto_bank_x_net_MSR.onRequest", error)
    }
}

const createSearchFilter = (fieldId: string, innerSearchOperator: search.Operator, outerSearchOperator, values: any[]) => {
    try {
        const filters = [];
        for (var i = 0; i < values.length; i++) {
            if (i != values.length - 1) filters.push([fieldId, innerSearchOperator, values[i]], outerSearchOperator);
            else filters.push([fieldId, innerSearchOperator, values[i]]);
        }
        log.debug('filters', filters);
        return filters;
    } catch (e) {
        log.error({ title: 'Error : createSearchFilter', details: e });
        throw e;
    }
}

const getAccessToken = (url_token, authorization) => {
    try {
        
        const urlObj = String(url_token);

        const bodyObj = {
                "grant_type": "client_credentials",
                "scope": "cobrancas.boletos-info cobrancas.boletos-requisicao"
        };

        const authObj = authorization; //* alterado basic pelo de produção;

        const headerArr = {};
        headerArr['Authorization'] = authObj;
        headerArr['Accept'] = 'application/json';

        const response = https.post({
                url: urlObj,
                body: bodyObj,
                headers: headerArr
        });


        return {
            body: JSON.parse(response.body),
        };

    } catch (e) {
            log.error('getAccessToken',e);
    }
}

const getIntergrcaoBB = () => {
    try{
        const searchIntegracaoBB = search.create({
            type: CTS.INTEGRACAO_BB.ID,
            filters: [],
            columns: [
                search.createColumn({name: CTS.INTEGRACAO_BB.KEY}),
                search.createColumn({name: CTS.INTEGRACAO_BB.URL_TOKEN}),
                search.createColumn({name: CTS.INTEGRACAO_BB.AUTHORIZATION}),
                search.createColumn({name: CTS.INTEGRACAO_BB.CONTA}),
                search.createColumn({name: CTS.INTEGRACAO_BB.AGENCIA})
            ]
        }).run().getRange({start: 0, end: 1});

        if (searchIntegracaoBB.length > 0) {
            return {
                'key': searchIntegracaoBB[0].getValue({name: CTS.INTEGRACAO_BB.KEY}),
                'url_token': searchIntegracaoBB[0].getValue({name: CTS.INTEGRACAO_BB.URL_TOKEN}),
                'authorization': searchIntegracaoBB[0].getValue({name: CTS.INTEGRACAO_BB.AUTHORIZATION}),
            };
        } else {
            throw {
                'msg': 'cadastrar RT INTEGRACAO BB'
            };
        }
    } catch (e) {
        log.error('getIntergrcaoBB',e);
        throw e
    }

}

const htmlPage = (filters: any[], range: number) => {
    try {

        const searchParcela = search.create({
            type: CTS.PARCELA_CNAB.ID,
            filters: filters,
            columns: [
                search.createColumn({name: CTS.PARCELA_CNAB.NOSSO_NUMERO}),
                search.createColumn({name: CTS.PARCELA_CNAB.PAGO}),
                search.createColumn({name: CTS.PARCELA_CNAB.TRANSACTION}),
                search.createColumn({name: 'custrecord_dk_cnab_mensagem_bloqueto'}),
                search.createColumn({name: 'custrecord_dk_cnab_num_titbeneficiario'}),
            ]
        }).run().getRange({start: 0, end: range})
        
        let html = `<!DOCTYPE html>
        <html lang="pt-br">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Pagos</title>
        </head>
        <body>
        <table border="1" style="border-collapse: collapse;">
                <tr style="background-color: #D2CDCD;">
                    <th>linha</th>
                    <th>Nosso Número</th>
                    <th>CR</th>
                    <th>NF</th>
                    <th>Parcela</th>
                    <th>Pago</th>
                <tr>
                `

        for (var i=0; i < searchParcela.length; i++) {
            
            const pago = searchParcela[i].getValue({name: CTS.PARCELA_CNAB.PAGO})
            const transaction = searchParcela[i].getText({name: CTS.PARCELA_CNAB.TRANSACTION})
            const nossNum = searchParcela[i].getValue({name: CTS.PARCELA_CNAB.NOSSO_NUMERO})
            const parcela = searchParcela[i].getValue({name: 'custrecord_dk_cnab_mensagem_bloqueto'})
            const nf = searchParcela[i].getValue({name: 'custrecord_dk_cnab_num_titbeneficiario'})


            let tr 

            if (pago == "F" || pago == false) {
                tr = '<tr style="background-color: #FABFBF;">'
            } else {
                tr = '<tr>'
            }

            html += tr
            html += `<td style="padding: 10px;">${i+1}</td>`
            html += `<td style="padding: 10px;"> ${nossNum}</td>`
            html += `<td style="padding: 10px;">${transaction}</td>`
            html += `<td style="padding: 10px;">${nf}</td>`
            html += `<td style="padding: 10px;">${parcela}</td>`
            html += `<td style="padding: 10px;">${pago == "T" || pago == true? 'Pago' : 'Não Pago'}</td>`
            html += '</tr>'

        }

        html += `</table>
        <p>${range}</p>
        </body>
        </html>
        `
        return html

    } catch (error) {
        log.error("jtc_page_boleto_bank_x_net_MSR.htmPage", error)
    }
}