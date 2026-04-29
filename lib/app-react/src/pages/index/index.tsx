import { View, Text } from '@tarojs/components'
import { useLoad } from '@tarojs/taro'
import { Button } from "@/components/ui/button";

export default function Index () {
  useLoad(() => {
    console.log('Page loaded.')
  })

  return (
    <View className='p-3'>
      <View className='index'>
        <Button>Hello world!</Button>
        <Text className='text-sm block'>Hello world!</Text>
        <Text className='text-xs text-[#007bff]'>Hello world!</Text>
      </View>
    </View>
  )
}
