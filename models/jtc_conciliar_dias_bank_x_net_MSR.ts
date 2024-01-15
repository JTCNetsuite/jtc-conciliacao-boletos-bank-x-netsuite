/**
 * @NAPIVersion 2.x
 * @NScriptType MapReduceScript
 */



import { EntryPoints } from "N/types"
import * as log from 'N/log'
import * as https from 'N/https'
import * as search from "N/search"
import { constante as CTS } from "../module/jtc_conciliar_boleto_CTS"
import * as file from 'N/file'

export const getInputData:  EntryPoints.MapReduce.getInputData = () => {
    try {

        const data = getIntergrcaoBB()
        const token = getAccessToken(data.url_token, data.authorization)
        const authObj = token.body.token_type + " " + token.body.access_token

        const headerArr = {};
        headerArr['Authorization'] = authObj;
        headerArr['Accept'] = 'application/json';

        const requestListagemBoletos = https.get({
            url: 'https://api.bb.com.br/cobrancas/v2/boletos?gw-dev-app-key=4a5e515a85aa0cb8a74b71646d5ec025&indicadorSituacao=B&agenciaBeneficiario=3221&contaBeneficiario=19570&dataInicioMovimento=21.12.2023&dataFimMovimento=21.12.2023&codigoEstadoTituloCobranca=6',
            headers: headerArr
        })
        
        const boletos =JSON.parse(requestListagemBoletos.body).boletos

        if (JSON.parse(requestListagemBoletos.body).indicadorContinuidade== "S") {

            const requestListagemBoletos2 = JSON.parse(https.get({
                url: 'https://api.bb.com.br/cobrancas/v2/boletos?gw-dev-app-key=4a5e515a85aa0cb8a74b71646d5ec025&indicadorSituacao=B&agenciaBeneficiario=3221&contaBeneficiario=19570&dataInicioMovimento=18.12.2023&dataFimMovimento=18.12.2023&codigoEstadoTituloCobranca=6&indice=300',
                headers: headerArr
            }).body)

            const boletos2 = requestListagemBoletos2.boletos
            
            
            for (var i =0; i < boletos2.length; i++) {
                boletos.push(boletos2[i])
            }
        }

        let html = `<!DOCTYPE html>
        <html lang="pt-br">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Pagos</title>
        </head>
        <style>
            * {
            font-family: Arial, Helvetica, sans-serif;
            }
            td {
                padding: 10px;
            }
        </style>
        <body>
        <table border="1" style="border-collapse: collapse;">
                <tr style="background-color: #D2CDCD;">
                    <th>linha</th>
                    <th>Nosso Número</th>
                    <th>CR</th>
                    <th>NF</th>
                    <th>Parcela</th>
                    <th>Status</th>
                <tr>
                `
        
        for (var j=0; j < boletos.length; j++) {
            
            // log.debug(`boletos ${j}`, boletos[j])
            const nossoNum = boletos[j].numeroBoletoBB
            const urlBoletoIndividual = `https://api.bb.com.br/cobrancas/v2/boletos/${nossoNum}?gw-dev-app-key=4a5e515a85aa0cb8a74b71646d5ec025&numeroConvenio=2202864`

            const nfBoleto =JSON.parse(https.get({
                url: urlBoletoIndividual,
                headers: headerArr
            }).body).numeroTituloCedenteCobranca

            const searchCnabParcela = search.create({
                type: CTS.PARCELA_CNAB.ID,
                filters: [
                    // ['custrecord_dk_cnab_num_titbeneficiario', search.Operator.IS, nfBoleto],
                    // "AND",
                    [CTS.PARCELA_CNAB.NOSSO_NUMERO, search.Operator.IS, nossoNum]
                ],
                columns: [
                    search.createColumn({name: CTS.PARCELA_CNAB.NOSSO_NUMERO}),
                    search.createColumn({name: CTS.PARCELA_CNAB.TRANSACTION}),
                    search.createColumn({name: CTS.PARCELA_CNAB.PAGO}),
                    search.createColumn({name: 'custrecord_dk_cnab_utilizar_beneficiario'}),
                    search.createColumn({name: 'custrecord_dk_cnab_num_titbeneficiario'}),
                ]
            }).run().getRange({start: 0, end: 10})

            let tr 
            if (searchCnabParcela.length < 1 ) {
                log.debug("STATUS", "BOLETO NÃO ENCONTRADO")
                html += '<tr style="background-color: #FAF6BF;">'

                html += `<td>${j+1}</td>`
                html += `<td>${nossoNum}</td>`
                html += `<td>...</td>`
                html += `<td>${nfBoleto}</td>`
                html += `<td>...</td>`
                html += `<td>Boleto não encotrando no sistema</td>`
                html += '</tr>'

            } else if (searchCnabParcela.length > 1) {
                log.debug("STATUS", "BOLETO MAIS DE 2")
                for (var b = 0; b < searchCnabParcela.length; b++) {
                    html += '<tr style="background-color: #FAD5BF;">'
                    html += `<td>${j+1}</td>`
                    html += `<td>${nossoNum}</td>`
                    html += `<td>${searchCnabParcela[b].getText({name: CTS.PARCELA_CNAB.TRANSACTION})}</td>`
                    html += `<td>${searchCnabParcela[b].getValue({name: 'custrecord_dk_cnab_num_titbeneficiario'})}</td>`
                    html += `<td>${searchCnabParcela[b].getValue({name: 'custrecord_dk_cnab_utilizar_beneficiario'})}</td>`
                    html += `<td>${searchCnabParcela[b].getValue({name: CTS.PARCELA_CNAB.PAGO}) == true ? 'Pago': "Não Pago"}</td>`
                    html += '</tr>'
                }
            } else {
                log.debug("STATUS", "BOLETO ENCONTRADO")
                const pago = searchCnabParcela[0].getValue({name: CTS.PARCELA_CNAB.PAGO})
                
                if (pago == 'T' || pago == true) {
                    html += '<tr>'

                } else {
                    html += '<tr style="background-color: #FABFBF;">'
                }

                html += `<td>${j+1}</td>`
                html += `<td>${nossoNum}</td>`
                html += `<td>${searchCnabParcela[0].getText({name: CTS.PARCELA_CNAB.TRANSACTION})}</td>`
                html += `<td>${searchCnabParcela[0].getValue({name:'custrecord_dk_cnab_num_titbeneficiario'})}</td>`
                html += `<td>${searchCnabParcela[0].getValue({name: 'custrecord_dk_cnab_utilizar_beneficiario'})}</td>`
                html += `<td>${searchCnabParcela[0].getValue({name: CTS.PARCELA_CNAB.PAGO}) == true ? 'Pago': "Não Pago"}</td>`
                html += '</tr>'
            }
        }

        html += `</table>
        </body>
        </html>
        `

        const filecreate = file.create({
            fileType:  file.Type.HTMLDOC,
            name: '22/12/2023.html',
            contents: html,
            folder: 42436
        }).save()
        log.debug("file", filecreate)
        

    } catch (error) {
        log.error("jtc_conciliar_dias_bank_x_net_MSR.getInputData", error)
    }
}

export const map: EntryPoints.MapReduce.map = (ctx: EntryPoints.MapReduce.mapContext) => {}

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