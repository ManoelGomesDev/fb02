import { useReadContract, useWriteContract, useAccount } from 'wagmi'
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '@/lib/web3'
import { parseEther } from 'viem'

// 🚀 NOVO: Hook que busca TODAS as tarefas com dados completos em 1 chamada
export function useAllUserTasks() {
  const { address } = useAccount()
  return useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'getUserTasksWithData',
    args: address ? [address] : undefined,
    query: { enabled: !!address }
  })
}

// 📊 SUPER SIMPLIFICADO: Hook para métricas e tarefas em um só
export function useTaskMetrics() {
  const { data: allTasks, isLoading, error, refetch } = useAllUserTasks()
  
  // Se ainda está carregando ou sem dados
  if (isLoading || !allTasks) {
    return {
      // Métricas
      total: 0,
      concluidas: 0,
      pendentes: 0,
      weiInStake: 0,
      // Dados
      tasks: [],
      isLoading: true,
      error: null,
      refetch
    }
  }

  // Se não há tarefas
  if (!Array.isArray(allTasks) || allTasks.length === 0) {
    return {
      total: 0,
      concluidas: 0,
      pendentes: 0,
      weiInStake: 0,
      tasks: [],
      isLoading: false,
      error: null,
      refetch
    }
  }

  // 🧮 Calcular métricas automaticamente
  let concluidas = 0
  let totalStake = 0

  allTasks.forEach((task: any) => {
    if (task.status) {
      concluidas++
    } else {
      totalStake += Number(task.stakeAmount)
    }
  })

  return {
    // Métricas calculadas automaticamente
    total: allTasks.length,
    concluidas,
    pendentes: allTasks.length - concluidas,
    weiInStake: totalStake / 1e18,
    // Dados completos das tarefas
    tasks: allTasks,
    isLoading: false,
    error,
    refetch
  }
}

// ✍️ Hook: Criar tarefa (mantido igual)
export function useCreateTask() {
  const { writeContract, isPending, error } = useWriteContract()
  
  const createTask = async (
    title: string, 
    description: string, 
    deadline: Date,
    stakeAmount: string = '0.001'
  ) => {
    const deadlineTimestamp = Math.floor(deadline.getTime() / 1000)
    await writeContract({
      address: CONTRACT_ADDRESS,
      abi: CONTRACT_ABI,
      functionName: 'createTask',
      args: [title, description, BigInt(deadlineTimestamp)],
      value: parseEther(stakeAmount),
    })
  }
  
  return { createTask, isPending, error }
}

// ✅ Hook: Completar tarefa (mantido igual)
export function useCompleteTask() {
  const { writeContract, isPending, error } = useWriteContract()
  
  const completeTask = async (taskId: number) => {
    await writeContract({
      address: CONTRACT_ADDRESS,
      abi: CONTRACT_ABI,
      functionName: 'completeTask',
      args: [BigInt(taskId)],
    })
  }
  
  return { completeTask, isPending, error }
}

// 🔗 Hook: Status da conexão (mantido igual)
export function useWeb3Status() {
  const { address, isConnected } = useAccount()
  return {
    address,
    isConnected,
    shortAddress: address ? `${address.slice(0, 6)}...${address.slice(-4)}` : null
  }
}

// �� Hook: Balance do contrato (mantido igual)
export function useContractBalance() {
  const { data: balance, isLoading: balanceLoading, refetch: refetchBalance } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'getContractBalance',
  })
  
  return {
    balance,
    balanceLoading,
    balanceInEth: balance ? Number(balance) / 1e18 : 0,
    refetchBalance
  }
}

// 🎯 Hook individual de tarefa (para compatibilidade com TaskItem)
export function useTaskData(taskId: number | undefined) {
  return useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'getTask',
    args: taskId ? [BigInt(taskId)] : undefined,
    query: { enabled: !!taskId }
  })
}
