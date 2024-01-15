/**
 * @NAPIVersion 2.x
 * @NModuleScope public
 */



export const constante = {
    PARCELA_CNAB: {
        ID: 'customrecord_dk_cnab_aux_parcela',
        NOSSO_NUMERO: 'custrecord_dk_cnab_nosso_numero',
        TRANSACTION: 'custrecord_dk_cnab_transacao',
        PAGO: 'custrecord_jtc_int_boleto_pago',
        DT_VENCIMENTO: 'custrecord_dk_cnab_dt_vencimento'
    },
    RT_CONC_BANK_X_NETSUITE: {
        ID: 'customrecord_jtc_conciliacao_bank_x_net',
        BOLETO_BANCO: '	custrecord_boleto_banco',
        STATUS_BANCO: 'custrecord_status_banco',
        STATUS_NETSUITE: 'custrecord_status_netsuite',
        BOLETO_NETSUITE : 'custrecord_jtc_boleto_netsuite',
        DATA: '	custrecord_data_da_conciliacao'
    },
    INTEGRACAO_BB:{
        ID: 'customrecord_jtc_rt_integracao_bb',
        KEY: 'custrecord_jtc_int_bb_key',
        URL_TOKEN: 'custrecord_jtc_int_bb_url_token',
        AUTHORIZATION: 'custrecord_jtc_int_bb_authorization',
        CONTA: 'custrecord_jtc_int_bb_conta',
        AGENCIA: 'custrecord_jtc_int_bb_agencia'
    },
    COSTUMER_PAYMENT: {
        SUBSIDIARY: 'subsidiary',
        ACCOUNT: 'account',
        ACCOUNT_CUSTOM: 'custbody_jtc_cont_banc_inter',
        DIFENCA_PAGO:'custbody_jtc_int_dif_valor_org_pago',
        PAYMENT: 'payment',
        TRANDATE: 'trandate',
        SUB_APPLY: {
            ID: 'apply',
            APPLY: 'apply',
            NUM_PARCELA: 'installmentnumber',
            INVOICE_ID: 'doc'
        }
    }
}