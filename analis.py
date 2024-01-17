import matplotlib.pyplot as plt
import pandas as pd

dt = pd.read_csv("./dados.csv", sep=';')
print()
labels = dt['Máximo de Descrição']
size = dt['Soma de Quantidade']

# Estamos criando a representação, área de plotagem
fig1, ax1 = plt.subplots ()
# Criando o gráfico
ax1.pie(size, labels=labels, autopct='%1.1f%%',
shadow=True, startangle=90)
# Com esta opção, o gráfico ficará em círculo
ax1.axis ('equal')
# Mostra o gráfico
plt.show ()