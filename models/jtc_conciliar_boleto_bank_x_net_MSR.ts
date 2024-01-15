/**
 * @NAPIVersion 2.x
 * @NModuleScope public
 */



import { EntryPoints } from "N/types"
import * as log from 'N/log'
import * as file from 'N/file'
import * as search from 'N/search'
import { constante as CTS } from "../module/jtc_conciliar_boleto_CTS"
import * as record from 'N/record'
import * as https from 'N/https'


export const getInputData = () => {
    try {
        const diaAnterior = obterDiaAnterior()
        log.debug("dia Anterior", diaAnterior)

        let url = `https://api.bb.com.br/cobrancas/v2/boletos?gw-dev-app-key=4a5e515a85aa0cb8a74b71646d5ec025&indicadorSituacao=B&agenciaBeneficiario=3221&contaBeneficiario=19570&dataInicioMovimento=${diaAnterior}&dataFimMovimento=${diaAnterior}&codigoEstadoTituloCobranca=6`
        // const url = `https://api.bb.com.br/cobrancas/v2/boletos?gw-dev-app-key=4a5e515a85aa0cb8a74b71646d5ec025&indicadorSituacao=B&agenciaBeneficiario=3221&contaBeneficiario=19570&dataInicioMovimento=08.12.2023&dataFimMovimento=08.12.2023&codigoEstadoTituloCobranca=6`
        const data = getIntergrcaoBB()
        const token = getAccessToken(data.url_token, data.authorization)
        const authObj = token.body.token_type + " " + token.body.access_token

        const headerArr = {}
        headerArr['Authorization'] = authObj
        headerArr['Accept'] = 'application/json'

        const request = https.get({
            url: url,
            headers: headerArr
        })

        const response = JSON.parse(request.body)

        const boletos_res = []

        // log.debug("continuaidade", response.indicadorContinuidade)
        
        if (response.indicadorContinuidade == 'S') {
            const indice = response.proximoIndice
            url +='&indice=300'

            log.debug("url", url)
            const request2 = https.get({
                url: url,
                headers: headerArr
            })
            const repsonse2 = JSON.parse(request2.body)
            // log.debug("respone 2", repsonse2.boletos.length)

            // for (var j=0; j < response.boletos.length; j++) {
            //     boletos_res.push(response.boletos[j])
            // }
            
            for (var i =0; i < repsonse2.boletos.length; i++) {
                response.boletos.push(repsonse2.boletos[i])
                
            }

            // log.debug("retornb",response.boletos.length)

            return  response.boletos

        } else {
            return response.boletos
        }

        
        
    } catch (error) {
        log.error("jtc_conciliar_boleto_bank_x_net.getInputData", error)
    }
}

export const map = (ctx: EntryPoints.MapReduce.mapContext) => {
    try {
        log.debug("ctx", ctx.value)
        const boleto = JSON.parse(ctx.value)

        const nossoNum = boleto.numeroBoletoBB
        const valorPage = boleto.valorPago
        const dtPagamento = String(boleto.dataCredito).split(".")
        const valorAtual = boleto.valorAtual


        let parcelaNum 
        let invoice
        const searchParcelaCnab = search.create({
            type: CTS.PARCELA_CNAB.ID,
            filters: [
                [CTS.PARCELA_CNAB.NOSSO_NUMERO, search.Operator.IS, nossoNum],
                'AND',
                [CTS.PARCELA_CNAB.PAGO, search.Operator.IS, "F"]
            ],
            columns: [
                search.createColumn({name: CTS.PARCELA_CNAB.TRANSACTION}),
                search.createColumn({name: 'custrecord_dk_cnab_utilizar_beneficiario'}),
            ]
        }).run().getRange({start: 0 ,end: 1})
        
        
        if (searchParcelaCnab.length > 0) {
            parcelaNum = String(searchParcelaCnab[0].getValue({name:'custrecord_dk_cnab_utilizar_beneficiario' })).split(" ")[1]
            invoice = searchParcelaCnab[0].getValue({name: CTS.PARCELA_CNAB.TRANSACTION})

            const custmerPayment = record.transform({
                fromId: invoice, 
                fromType: record.Type.INVOICE,
                toType: record.Type.CUSTOMER_PAYMENT
            })

            const subId = custmerPayment.getValue(CTS.COSTUMER_PAYMENT.SUBSIDIARY)
            if (subId == 3) {
                custmerPayment.setValue({fieldId: CTS.COSTUMER_PAYMENT.ACCOUNT, value: 620})
                // custmerPayment.setValue({fie ldId: CTS.COSTUMER_PAYMENT.ACCOUNT_CUSTOM, value: 620})
            } else if(subId == 5)  {
                custmerPayment.setValue({fieldId: CTS.COSTUMER_PAYMENT.ACCOUNT, value: 726})
                custmerPayment.setValue({fieldId: CTS.COSTUMER_PAYMENT.ACCOUNT_CUSTOM, value: 620})
            } else {
                custmerPayment.setValue({fieldId: CTS.COSTUMER_PAYMENT.ACCOUNT_CUSTOM, value: 620})
            }

            const sublistId =  CTS.COSTUMER_PAYMENT.SUB_APPLY.ID
            const lineCount = custmerPayment.getLineCount({sublistId: sublistId})


            if (valorPage != valorAtual) {
                custmerPayment.setValue({
                    fieldId: CTS.COSTUMER_PAYMENT.DIFENCA_PAGO,
                    value: valorPage - valorAtual
                })
            }

            custmerPayment.setValue({fieldId: CTS.COSTUMER_PAYMENT.PAYMENT, value: valorPage})
            custmerPayment.setValue({
                fieldId: CTS.COSTUMER_PAYMENT.TRANDATE,
                value: new Date(`${dtPagamento[1]}/${dtPagamento[0]}/${dtPagamento[2]}`)
            });
          


            for (var i = 0; i < lineCount; i++) {
                custmerPayment.setSublistValue({
                    sublistId: sublistId,
                    fieldId: CTS.COSTUMER_PAYMENT.SUB_APPLY.APPLY,
                    line: i,
                    value: false
                })

                const idInvoiceFromSublist = custmerPayment.getSublistValue({
                    sublistId: sublistId,
                    fieldId: CTS.COSTUMER_PAYMENT.SUB_APPLY.INVOICE_ID,
                    line: i
                })
                const numInstallmentFromSublist = custmerPayment.getSublistValue({
                    sublistId: sublistId,
                    fieldId: CTS.COSTUMER_PAYMENT.SUB_APPLY.NUM_PARCELA,
                    line: i
                })
                

                if (idInvoiceFromSublist == invoice && numInstallmentFromSublist == parcelaNum) {
                    log.debug("igual e setar", "START")
                    custmerPayment.setSublistValue({
                        sublistId: sublistId,
                        fieldId: CTS.COSTUMER_PAYMENT.SUB_APPLY.APPLY,
                        line: i,
                        value: true
                    })
                    const f = custmerPayment.getSublistValue({
                        sublistId: sublistId,
                        fieldId: CTS.COSTUMER_PAYMENT.SUB_APPLY.APPLY,
                        line: i
                    })
                    log.debug("OK", f)
                }
            }

            const idCostumrPay = custmerPayment.save()

            if (!!idCostumrPay) {
                const recParcela = record.load({
                    id: searchParcelaCnab[0].id,
                    type: CTS.PARCELA_CNAB.ID
                })
                recParcela.setValue({fieldId: 'custrecord_jtc_int_boleto_pago', value: true })
                const idRet = recParcela.save()
                log.audit("id Custumer ", idCostumrPay)
                log.audit("id ParcelaCnab ", idRet)
            }
        }
            

    } catch (error) {
        log.error("jtc_conciliar_boleto_bank_x_net.map",error)
    }
}

const obterDiaAnterior = () =>{
    var hoje = new Date();
    
    // Se hoje for segunda-feira, ajusta para a última sexta-feira
    if (hoje.getDay() === 1) { // 0 é domingo, 1 é segunda-feira, ..., 6 é sábado
      hoje.setDate(hoje.getDate() - 3);
    } else {
      // Caso contrário, obtém o dia anterior
      hoje.setDate(hoje.getDate() - 1);
    }
    
    // Formata a data no estilo dd.mm.yyyy
    var dia: any = hoje.getDate();
    var mes: any = hoje.getMonth() + 1; // Os meses começam do zero
    var ano = hoje.getFullYear();
  
    // Adiciona zero à esquerda, se necessário
    dia = (dia < 10) ? '0' + dia : dia;
    mes = (mes < 10) ? '0' + mes : mes;
  
    var resultadoFormatado = dia + '.' + mes + '.' + ano;
    
    return resultadoFormatado;
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

const formartDate = (dateInfo) => {
    const date = new Date(dateInfo);
    var day: string | number = date.getDate();
    var month: string | number = date.getMonth() + 1;
    const year = date.getFullYear();

    if (day < 10)
        day = '0'+day;
    if (month < 10) {
        month = '0'+month;
    }

    return ""+day+"."+month+"."+year;

}