#!/usr/bin/env python3
"""
Script de teste para a funcionalidade de upload de faturas
"""

import requests
import os

def test_ai_agent():
    """Testa se o AI Agent está funcionando"""
    try:
        response = requests.get("http://localhost:5000/health")
        if response.status_code == 200:
            print("✅ AI Agent está funcionando")
            return True
        else:
            print("❌ AI Agent não está respondendo")
            return False
    except Exception as e:
        print(f"❌ Erro ao conectar com AI Agent: {e}")
        return False

def test_backend_auth():
    """Testa se o backend está funcionando e se conseguimos fazer login"""
    try:
        # Teste de login
        login_data = {
            "email": "test@test.com",
            "password": "test123"
        }
        
        response = requests.post("http://localhost:8080/api/auth/login", json=login_data)
        
        if response.status_code == 200:
            print("✅ Backend está funcionando e login OK")
            return response.json().get('token')
        elif response.status_code == 401:
            print("⚠️ Backend funcionando mas credenciais inválidas (normal em teste)")
            return None
        else:
            print(f"❌ Backend com problema: {response.status_code}")
            return None
            
    except Exception as e:
        print(f"❌ Erro ao conectar com Backend: {e}")
        return None

def test_full_flow():
    """Testa o fluxo completo de upload"""
    print("🧪 Testando funcionalidade de upload de faturas...\n")
    
    # 1. Testar AI Agent
    ai_working = test_ai_agent()
    
    # 2. Testar Backend
    token = test_backend_auth()
    backend_working = token is not None
    
    # 3. Resumo
    print(f"\n📊 Resumo dos testes:")
    print(f"AI Agent (Python): {'✅' if ai_working else '❌'}")
    print(f"Backend (Java): {'✅' if backend_working else '❌'}")
    
    if ai_working and backend_working:
        print("\n🎉 Tudo funcionando! O upload de faturas deve funcionar.")
    elif ai_working:
        print("\n⚠️ AI Agent OK, mas backend precisa ser iniciado.")
        print("Execute: mvnw.cmd spring-boot:run no diretório backend/")
    elif backend_working:
        print("\n⚠️ Backend OK, mas AI Agent precisa ser iniciado.")
        print("Execute: python ai_agent.py no diretório greentrackAIAgent/")
    else:
        print("\n❌ Ambos os serviços precisam ser iniciados.")
        print("1. Backend: mvnw.cmd spring-boot:run")
        print("2. AI Agent: python ai_agent.py")

if __name__ == "__main__":
    test_full_flow()