import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Modal,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { 
  getEmployees, 
  updateEmployeeWorkMode, 
  getWorkModeStatistics,
  getPendingWorkModeRequests,
  processWorkModeRequest
} from '../utils/employees';
import { 
  getAllWorkModes, 
  getWorkModeLabel, 
  getWorkModeColor,
  getWorkModeIcon 
} from '../utils/workModes';

export default function EmployeeManagement({ route }) {
  const { user } = route.params;
  const [employees, setEmployees] = useState([]);
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [showWorkModeModal, setShowWorkModeModal] = useState(false);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [showRequestsModal, setShowRequestsModal] = useState(false);
  const [stats, setStats] = useState({ total: 0, inOffice: 0, semiRemote: 0, fullyRemote: 0 });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    await Promise.all([
      loadEmployees(),
      loadPendingRequests(),
      loadStatistics()
    ]);
  };

  const loadEmployees = async () => {
    try {
      const employeeList = await getEmployees();
      setEmployees(employeeList);
      setFilteredEmployees(employeeList);
    } catch (error) {
      console.error('Error loading employees:', error);
      Alert.alert('Error', 'Failed to load employees');
    }
  };

  const loadPendingRequests = async () => {
    try {
      const requests = await getPendingWorkModeRequests();
      setPendingRequests(requests);
    } catch (error) {
      console.error('Error loading pending requests:', error);
    }
  };

  const loadStatistics = async () => {
    try {
      const statistics = await getWorkModeStatistics();
      setStats(statistics);
    } catch (error) {
      console.error('Error loading statistics:', error);
    }
  };

  const onRefresh = async () => {
    setIsRefreshing(true);
    await loadData();
    setIsRefreshing(false);
  };

  const handleWorkModeChange = (employee) => {
    setSelectedEmployee(employee);
    setShowWorkModeModal(true);
  };

  const confirmWorkModeChange = async (newWorkMode) => {
    try {
      const success = await updateEmployeeWorkMode(
        selectedEmployee.id, 
        newWorkMode, 
        user.username
      );
      
      if (success) {
        Alert.alert(
          'Success', 
          `${selectedEmployee.name}'s work mode updated to ${getWorkModeLabel(newWorkMode)}`
        );
        await loadData();
      } else {
        Alert.alert('Error', 'Failed to update work mode');
      }
    } catch (error) {
      console.error('Error updating work mode:', error);
      Alert.alert('Error', 'Failed to update work mode');
    } finally {
      setShowWorkModeModal(false);
      setSelectedEmployee(null);
    }
  };

  const handleProcessRequest = async (requestId, status) => {
    try {
      const success = await processWorkModeRequest(
        requestId, 
        status, 
        user.username,
        status === 'approved' ? 'Request approved' : 'Request rejected'
      );
      
      if (success) {
        Alert.alert(
          'Success', 
          `Request ${status} successfully`
        );
        await loadData();
      } else {
        Alert.alert('Error', 'Failed to process request');
      }
    } catch (error) {
      console.error('Error processing request:', error);
      Alert.alert('Error', 'Failed to process request');
    }
  };

  const renderEmployee = ({ item }) => (
    <View className="bg-white rounded-xl p-4 mb-3 shadow-sm">
      <View className="flex-row items-center justify-between">
        <View className="flex-1">
          <Text className="text-lg font-semibold text-gray-800">
            {item.name}
          </Text>
          <Text className="text-gray-600 text-sm">
            {item.department} • {item.position}
          </Text>
          <Text className="text-gray-500 text-xs">
            @{item.username}
          </Text>
        </View>
        
        <View className="items-end">
          <View className="flex-row items-center mb-2">
            <Ionicons 
              name={getWorkModeIcon(item.workMode)} 
              size={16} 
              color={getWorkModeColor(item.workMode)} 
            />
            <Text 
              className="text-sm font-medium ml-1"
              style={{ color: getWorkModeColor(item.workMode) }}
            >
              {getWorkModeLabel(item.workMode)}
            </Text>
          </View>
          
          <TouchableOpacity
            className="bg-primary-500 rounded-lg px-3 py-1"
            onPress={() => handleWorkModeChange(item)}
          >
            <Text className="text-white text-xs font-medium">Change</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const renderPendingRequest = ({ item }) => (
    <View className="bg-white rounded-xl p-4 mb-3 shadow-sm">
      <View className="flex-row items-center justify-between mb-2">
        <Text className="text-lg font-semibold text-gray-800">
          {item.employeeId}
        </Text>
        <Text className="text-xs text-gray-500">
          {new Date(item.requestedAt).toLocaleDateString()}
        </Text>
      </View>
      
      <Text className="text-gray-600 mb-2">
        Requesting: <Text className="font-medium">{getWorkModeLabel(item.requestedMode)}</Text>
      </Text>
      
      {item.reason && (
        <Text className="text-gray-500 text-sm mb-3">
          Reason: {item.reason}
        </Text>
      )}
      
      <View className="flex-row space-x-2">
        <TouchableOpacity
          className="bg-green-500 rounded-lg px-4 py-2 flex-1"
          onPress={() => handleProcessRequest(item.id, 'approved')}
        >
          <Text className="text-white text-center font-medium">Approve</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          className="bg-red-500 rounded-lg px-4 py-2 flex-1"
          onPress={() => handleProcessRequest(item.id, 'rejected')}
        >
          <Text className="text-white text-center font-medium">Reject</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const WorkModeModal = () => (
    <Modal
      visible={showWorkModeModal}
      transparent
      animationType="slide"
      onRequestClose={() => setShowWorkModeModal(false)}
    >
      <View className="flex-1 justify-center items-center bg-black bg-opacity-50">
        <View className="bg-white rounded-xl p-6 mx-4 w-full max-w-sm">
          <Text className="text-xl font-bold text-gray-800 mb-4">
            Change Work Mode
          </Text>
          
          <Text className="text-gray-600 mb-4">
            {selectedEmployee?.name} - Current: {getWorkModeLabel(selectedEmployee?.workMode)}
          </Text>
          
          {getAllWorkModes().map((mode) => (
            <TouchableOpacity
              key={mode.value}
              className={`flex-row items-center p-3 rounded-lg mb-2 ${
                selectedEmployee?.workMode === mode.value ? 'bg-gray-100' : ''
              }`}
              onPress={() => confirmWorkModeChange(mode.value)}
              disabled={selectedEmployee?.workMode === mode.value}
            >
              <Ionicons 
                name={mode.icon} 
                size={20} 
                color={mode.color} 
              />
              <View className="ml-3 flex-1">
                <Text className="font-medium text-gray-800">
                  {mode.label}
                </Text>
                <Text className="text-sm text-gray-500">
                  {mode.description}
                </Text>
              </View>
              {selectedEmployee?.workMode === mode.value && (
                <Ionicons name="checkmark" size={20} color="#10b981" />
              )}
            </TouchableOpacity>
          ))}
          
          <TouchableOpacity
            className="bg-gray-200 rounded-lg p-3 mt-4"
            onPress={() => setShowWorkModeModal(false)}
          >
            <Text className="text-center font-medium text-gray-700">Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  const PendingRequestsModal = () => (
    <Modal
      visible={showRequestsModal}
      transparent
      animationType="slide"
      onRequestClose={() => setShowRequestsModal(false)}
    >
      <View className="flex-1 justify-center items-center bg-black bg-opacity-50">
        <View className="bg-white rounded-xl p-6 mx-4 w-full max-w-md max-h-96">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-xl font-bold text-gray-800">
              Pending Requests
            </Text>
            <TouchableOpacity onPress={() => setShowRequestsModal(false)}>
              <Ionicons name="close" size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>
          
          {pendingRequests.length > 0 ? (
            <FlatList
              data={pendingRequests}
              renderItem={renderPendingRequest}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
            />
          ) : (
            <View className="items-center py-8">
              <Ionicons name="checkmark-circle" size={48} color="#10b981" />
              <Text className="text-gray-600 mt-2">No pending requests</Text>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white px-6 py-4 shadow-sm">
        <View className="flex-row items-center justify-between mb-4">
          <Text className="text-xl font-bold text-gray-800">
            Employee Management
          </Text>
          
          <TouchableOpacity
            className="bg-orange-500 rounded-xl px-4 py-2"
            onPress={() => setShowRequestsModal(true)}
          >
            <View className="flex-row items-center">
              <Ionicons name="notifications" size={16} color="white" />
              <Text className="text-white font-semibold ml-1">
                Requests ({pendingRequests.length})
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* Statistics */}
      <View className="bg-white mx-4 my-4 rounded-xl p-4 shadow-sm">
        <Text className="text-lg font-semibold text-gray-800 mb-3">
          Work Mode Distribution
        </Text>
        <View className="flex-row justify-around">
          <View className="items-center">
            <Text className="text-2xl font-bold text-blue-500">{stats.inOffice}</Text>
            <Text className="text-gray-600 text-sm">In Office</Text>
          </View>
          <View className="items-center">
            <Text className="text-2xl font-bold text-amber-500">{stats.semiRemote}</Text>
            <Text className="text-gray-600 text-sm">Semi Remote</Text>
          </View>
          <View className="items-center">
            <Text className="text-2xl font-bold text-emerald-500">{stats.fullyRemote}</Text>
            <Text className="text-gray-600 text-sm">Fully Remote</Text>
          </View>
        </View>
      </View>

      {/* Employees List */}
      {filteredEmployees.length > 0 ? (
        <FlatList
          data={filteredEmployees}
          renderItem={renderEmployee}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16 }}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
          }
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View className="flex-1 justify-center items-center px-6">
          <Ionicons name="people-outline" size={64} color="#d1d5db" />
          <Text className="text-xl font-semibold text-gray-500 mt-4 text-center">
            No employees found
          </Text>
          <Text className="text-gray-400 text-center mt-2">
            Employees will appear here once they are added to the system
          </Text>
        </View>
      )}

      <WorkModeModal />
      <PendingRequestsModal />
    </View>
  );
}
