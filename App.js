import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, FlatList, StyleSheet, ScrollView, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage'; // To store token securely
import axios from 'axios';
import { createStackNavigator } from '@react-navigation/stack';
import { NavigationContainer } from '@react-navigation/native';

const Stack = createStackNavigator();

// **Pantalla de registro**
const RegisterScreen = ({ navigation }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleRegister = async () => {
    try {
      await axios.post('https://01c1-200-80-163-202.ngrok-free.app/register', {
        username,
        password,
      });
      Alert.alert('Usuario registrado con éxito');
      navigation.navigate('Login');  // Después de registrar, vuelve al login
    } catch (error) {
      Alert.alert('Error en registro', error.response?.data?.error || 'Algo salió mal');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Registro</Text>
      <TextInput
        style={styles.input}
        placeholder="Username"
        value={username}
        onChangeText={setUsername}
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <Button title="Registrarse" onPress={handleRegister} />
      <Button title="Login" onPress={() => navigation.navigate('Login')} />
    </View>
  );
};

// Pantalla de Login
const LoginScreen = ({ navigation }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    try {
      const response = await axios.post('https://01c1-200-80-163-202.ngrok-free.app/login', {
        username,
        password,
      });
      const { token } = response.data;

      // Guardar el token de forma segura
      await AsyncStorage.setItem('token', token);

      // Navegar a la pantalla protegida (StockView)
      navigation.navigate('StockView');
    } catch (error) {
      Alert.alert('Login fallido', error.response?.data?.error || 'Algo salió mal');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Login</Text>
      <TextInput
        style={styles.input}
        placeholder="Username"
        value={username}
        onChangeText={setUsername}
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <Button title="Login" onPress={handleLogin} />
      <Button title="Registrarse" onPress={() => navigation.navigate('Register')} />
    </View>
  );
};

// Pantalla de Consulta de Stock
const StockView = () => {
  const [sku, setSku] = useState('');
  const [base, setBase] = useState('DEPOSEVN');
  const [stockData, setStockData] = useState([]);
  const [error, setError] = useState(null);

  const getStockData = async () => {
    try {
      const token = await AsyncStorage.getItem('token'); // Obtener el token

      const response = await axios.post(
        'https://01c1-200-80-163-202.ngrok-free.app/stock',
        { sku, base },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log('Response Data:', response.data);
      const stockItems = response.data;
      setStockData(stockItems);
      setError(null);
    } catch (err) {
      console.error('Error:', err.message);
      setError('No se pudo obtener los datos');
    }
  };

  // Función para separar el Sku y extraer el color y el talle
  const extractColorTalleFromSku = (sku) => {
    const parts = sku.split('#');
    const color = parts[1] || 'N/A';
    const talle = parts[2] || 'N/A';
    return { color, talle };
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Consulta de Stock</Text>

      <TextInput
        style={styles.input}
        placeholder="SKU"
        value={sku}
        onChangeText={setSku}
      />
      <TextInput
        style={styles.input}
        placeholder="Base (DEPOSEVN o DEPOFORT)"
        value={base}
        onChangeText={setBase}
      />

      <Button title="Consultar" onPress={getStockData} />

      {error && <Text style={styles.error}>{error}</Text>}

      <ScrollView style={styles.scrollView}>
        {stockData && Object.keys(stockData).length > 0 ? (
          <FlatList
            data={Object.entries(stockData)}
            keyExtractor={(item) => item[0]}
            renderItem={({ item }) => {
              const { color, talle } = extractColorTalleFromSku(item[0]);
              return (
                <View style={styles.item}>
                  <Text style={styles.subtitle}>Código Color y Talle: {item[0]}</Text>
                  <Text>Descripción: {item[1][0].Description}</Text>

                  <View style={styles.table}>
                    <View style={styles.tableHeader}>
                      <Text style={styles.tableHeaderText}>Local</Text>
                      <Text style={styles.tableHeaderText}>Cantidad</Text>
                      <Text style={styles.tableHeaderText}>Última Actualización</Text>
                      <Text style={styles.tableHeaderText}>Color</Text>
                      <Text style={styles.tableHeaderText}>Talle</Text>
                    </View>

                    <FlatList
                      data={item[1]}
                      keyExtractor={(stockItem, index) => index.toString()}
                      renderItem={({ item: stockItem }) => (
                        <View style={styles.tableRow}>
                          <Text style={styles.tableCell}>{stockItem.ResourceName}</Text>
                          <Text style={styles.tableCell}>{stockItem.Quantity}</Text>
                          <Text style={styles.tableCell}>{new Date(stockItem.LastUpdateDate).toLocaleDateString()}</Text>
                          <Text style={styles.tableCell}>{color}</Text>
                          <Text style={styles.tableCell}>{talle}</Text>
                        </View>
                      )}
                    />
                  </View>
                </View>
              );
            }}
          />
        ) : (
          <Text>No hay datos disponibles</Text>
        )}
      </ScrollView>
    </View>
  );
};

// Estilos
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  input: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: 10,
    paddingLeft: 10,
  },
  item: {
    padding: 10,
    borderBottomColor: 'gray',
    borderBottomWidth: 1,
    marginBottom: 20,
  },
  table: {
    borderWidth: 1,
    borderColor: '#000',
    borderRadius: 4,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#007bff',
    padding: 10,
  },
  tableHeaderText: {
    flex: 1,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  tableRow: {
    flexDirection: 'row',
    padding: 10,
    borderBottomColor: '#ddd',
    borderBottomWidth: 1,
  },
  tableCell: {
    flex: 1,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  error: {
    color: 'red',
    marginTop: 10,
  },
  scrollView: {
    marginTop: 10,
  },
});

// Componente principal de la app con navegación
const App = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login">
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="StockView" component={StockView} />
        <Stack.Screen name="Register" component={RegisterScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default App;
