#!/usr/bin/env python3
"""
Test script for Network Simulator Backend API
"""
import httpx
import asyncio
import json
from datetime import datetime


async def test_api():
    """Test the main API endpoints"""
    base_url = "http://localhost:8000"
    
    async with httpx.AsyncClient() as client:
        print("🚀 Testing Network Simulator Backend API")
        print("=" * 50)
        
        # Test 1: Root endpoint
        print("\n1. Testing root endpoint...")
        try:
            response = await client.get(f"{base_url}/")
            print(f"   ✅ Status: {response.status_code}")
            print(f"   📋 Response: {response.json()}")
        except Exception as e:
            print(f"   ❌ Error: {e}")
        
        # Test 2: Health check
        print("\n2. Testing health check...")
        try:
            response = await client.get(f"{base_url}/health")
            print(f"   ✅ Status: {response.status_code}")
            print(f"   📋 Response: {response.json()}")
        except Exception as e:
            print(f"   ❌ Error: {e}")
        
        # Test 3: Create a session
        print("\n3. Creating a test session...")
        try:
            session_data = {
                "student_name": "Test Student",
                "metadata_json": {"test": True}
            }
            response = await client.post(f"{base_url}/api/v1/sessions/", json=session_data)
            print(f"   ✅ Status: {response.status_code}")
            session_response = response.json()
            session_id = session_response["id"]
            print(f"   📋 Session ID: {session_id}")
            print(f"   📋 Student: {session_response['student_name']}")
        except Exception as e:
            print(f"   ❌ Error: {e}")
            return
        
        # Test 4: Create nodes
        print("\n4. Creating test nodes...")
        try:
            # Create first node
            node1_data = {
                "name": "Router1",
                "node_type": "router",
                "x_position": 100.0,
                "y_position": 100.0
            }
            response = await client.post(f"{base_url}/api/v1/nodes/{session_id}/nodes", json=node1_data)
            print(f"   ✅ Node 1 Status: {response.status_code}")
            node1_response = response.json()
            node1_id = node1_response["id"]
            print(f"   📋 Node 1 ID: {node1_id}")
            
            # Create second node
            node2_data = {
                "name": "Router2",
                "node_type": "router",
                "x_position": 200.0,
                "y_position": 200.0
            }
            response = await client.post(f"{base_url}/api/v1/nodes/{session_id}/nodes", json=node2_data)
            print(f"   ✅ Node 2 Status: {response.status_code}")
            node2_response = response.json()
            node2_id = node2_response["id"]
            print(f"   📋 Node 2 ID: {node2_id}")
            
        except Exception as e:
            print(f"   ❌ Error: {e}")
            return
        
        # Test 5: Create connection
        print("\n5. Creating connection between nodes...")
        try:
            connection_data = {
                "source_node_id": node1_id,
                "destination_node_id": node2_id,
                "bandwidth_mbps": 100.0,
                "latency_ms": 10.0
            }
            response = await client.post(f"{base_url}/api/v1/connections/{session_id}/connections", json=connection_data)
            print(f"   ✅ Status: {response.status_code}")
            connection_response = response.json()
            connection_id = connection_response["id"]
            print(f"   📋 Connection ID: {connection_id}")
        except Exception as e:
            print(f"   ❌ Error: {e}")
            return
        
        # Test 6: Create message
        print("\n6. Creating test message...")
        try:
            message_data = {
                "source_node_id": node1_id,
                "destination_node_id": node2_id,
                "content": "Hello from Router1 to Router2!",
                "packet_size_bytes": 1024
            }
            response = await client.post(f"{base_url}/api/v1/messages/{session_id}/messages", json=message_data)
            print(f"   ✅ Status: {response.status_code}")
            message_response = response.json()
            message_id = message_response["id"]
            print(f"   📋 Message ID: {message_id}")
        except Exception as e:
            print(f"   ❌ Error: {e}")
            return
        
        # Test 7: Validate network
        print("\n7. Validating network topology...")
        try:
            response = await client.post(f"{base_url}/api/v1/simulation/{session_id}/validate")
            print(f"   ✅ Status: {response.status_code}")
            validation_response = response.json()
            print(f"   📋 Network Valid: {validation_response.get('is_valid', False)}")
            print(f"   📋 Node Count: {validation_response.get('node_count', 0)}")
            print(f"   📋 Connection Count: {validation_response.get('connection_count', 0)}")
            if validation_response.get('issues'):
                print(f"   ⚠️  Issues: {validation_response['issues']}")
        except Exception as e:
            print(f"   ❌ Error: {e}")
        
        # Test 8: Get session stats
        print("\n8. Getting session statistics...")
        try:
            response = await client.get(f"{base_url}/api/v1/sessions/{session_id}/stats")
            print(f"   ✅ Status: {response.status_code}")
            stats_response = response.json()
            print(f"   📋 Statistics: {stats_response.get('statistics', {})}")
        except Exception as e:
            print(f"   ❌ Error: {e}")
        
        print("\n" + "=" * 50)
        print("🎉 API Testing Complete!")
        print(f"📊 Session ID for further testing: {session_id}")
        print("🌐 API Documentation: http://localhost:8000/docs")
        print("🔌 WebSocket URL: ws://localhost:8000/ws/{session_id}")


if __name__ == "__main__":
    asyncio.run(test_api())