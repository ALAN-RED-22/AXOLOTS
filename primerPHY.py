#Mi primer programa en python
print("Hola, Mundo!")
mi_variable = "A"
print(mi_variable)
mi_entero = 10
print(mi_entero)

def mi_funcion():
    print("Hola desde mi función")       
    print("Ingresa el primer numero a trabajar")
    try:
        numero1 = int(input())
    except ValueError:
        print("Por favor, ingresa un número válido.")
        return

    print("Ingresa el otro numero a trabajar")
    try:
        numero2 = int(input())
    except ValueError:
        print("Por favor, ingresa un número válido.")
        return

    multiplicacion = numero1 * numero2
    return multiplicacion
print("El resultado de la multiplicación es: ", mi_funcion())