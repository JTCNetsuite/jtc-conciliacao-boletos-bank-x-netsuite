import pandas as pd
import requests


def getToken():
    tokenUrl =  'https://oauth.bb.com.br/oauth/token'
    authorization = "Basic ZXlKcFpDSTZJalJtTlRWak56VXRNR015WVMwMFl5SXNJbU52WkdsbmIxQjFZbXhwWTJGa2IzSWlPakFzSW1OdlpHbG5iMU52Wm5SM1lYSmxJam8wTlRJMk1Td2ljMlZ4ZFdWdVkybGhiRWx1YzNSaGJHRmpZVzhpT2pGOTpleUpwWkNJNklqaGhOak13SWl3aVkyOWthV2R2VUhWaWJHbGpZV1J2Y2lJNk1Dd2lZMjlrYVdkdlUyOW1kSGRoY21VaU9qUTFNall4TENKelpYRjFaVzVqYVdGc1NXNXpkR0ZzWVdOaGJ5STZNU3dpYzJWeGRXVnVZMmxoYkVOeVpXUmxibU5wWVd3aU9qRXNJbUZ0WW1sbGJuUmxJam9pY0hKdlpIVmpZVzhpTENKcFlYUWlPakUyT0RNd05USXdNRE00TmpsOQ=="
    bodyObj = {   
            "grant_type": "client_credentials",
            "scope": "cobrancas.boletos-info cobrancas.boletos-requisicao"
    }

    headers = {
        "Authorization":  authorization,
        "Accept": "application/json"
    }   


    response = requests.post(url=tokenUrl, data=bodyObj, headers=headers)
    return response.json()




def getLiquidacao(dataIni, dataFim):
    # print(dataIni, dataFim)
    tokenCredenciais = getToken()
    token_type = tokenCredenciais['token_type']
    token = tokenCredenciais['access_token']

    
    headers = {
        "Authorization": token_type + " " + token,
        "Accept": "application/json"
    }



    url = f'https://api.bb.com.br/cobrancas/v2/boletos?gw-dev-app-key=4a5e515a85aa0cb8a74b71646d5ec025&indicadorSituacao=B&agenciaBeneficiario=3221&contaBeneficiario=19570&dataInicioMovimento={dataIni}&dataFimMovimento={dataFim}&codigoEstadoTituloCobranca=6'

    req = requests.get(url=url, headers=headers).json()
    # print(req)

    if req['indicadorContinuidade'] == "S":
        url += '&indice=300'
        req2 = requests.get(url=url, headers=headers).json()


        for i in range(len(req2['boletos'])):
            req['boletos'].append(req2['boletos'][i])

        # if req2['indicadorContinuidade'] == "S":
        #     url_n = 'https://api.bb.com.br/cobrancas/v2/boletos?gw-dev-app-key=4a5e515a85aa0cb8a74b71646d5ec025&indicadorSituacao=B&agenciaBeneficiario=3221&contaBeneficiario=19570&dataInicioMovimento=26.12.2023&dataFimMovimento=26.12.2023&codigoEstadoTituloCobranca=6&indice=600'
        #     req3 = requests.get(url=url_n, headers=headers).json()

        #     for i in range(len(req3['boletos'])):
        #         req['boletos'].append(req3['boletos'][i])
    

    return req['boletos']

    


def transformData():
    dataIn = input("data inicio: ")
    dataFim = input("data Fim: ")
    boletos = getLiquidacao(dataIn, dataFim)
    dt = pd.DataFrame(boletos)
    print(dt)
    dt.to_excel('tetse.xlsx')
    valor_nornal = 0
    valor_pago_toal = 0
    valor_dif = 0
    for i in range(len(boletos)):
        nosso = boletos[i]['numeroBoletoBB']
        valor = boletos[i]['valorOriginal']
        valor_pago = boletos[i]['valorPago']
        # print(f'{nosso} , {valor} , {valor_pago}  {valor - valor_pago}' )
        valor_nornal += valor
        valor_pago_toal += valor_pago
        valor_dif += (valor_pago - valor)


    print(f'{valor_nornal}, {valor_pago_toal}, {valor_dif}')

transformData()

def getBoletosVencidos():
    tokenCredenciais = getToken()
    token_type = tokenCredenciais['token_type']
    token = tokenCredenciais['access_token']

    
    headers = {
        "Authorization": token_type + " " + token,
        "Accept": "application/json"
    }


    boletos = []


    indice = 0

    while True:
       
        url = f'https://api.bb.com.br/cobrancas/v2/boletos?gw-dev-app-key=4a5e515a85aa0cb8a74b71646d5ec025&indicadorSituacao=A&agenciaBeneficiario=3221&contaBeneficiario=19570&boletoVencido=S&indice={indice}'
        req = requests.get(url=url, headers=headers).json()
        indicador = req['indicadorContinuidade']

        if indicador == 'S':
            indice = req['proximoIndice']
            url += f'&indice={indice}'
            tam = len(req['boletos'])

            for i in range(tam):
                boleto = req['boletos'][i]
                boletos.append(boleto)
        else:
            tam = len(req['boletos'])

            for i in range(tam):
                boleto = req['boletos'][i]
                boletos.append(boleto)

            break
        
    return boletos
    

def transDataTable():
    boletos = getBoletosVencidos()

    dt = pd.DataFrame(boletos)

    dt.to_excel("./boletos_vencidos.xlsx")


# transDataTable()

