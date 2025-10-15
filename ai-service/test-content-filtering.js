const openRouterService = require('./services/openRouterService');

async function testContentFiltering() {
  console.log('🧪 Testing Content Filtering và Scope Restriction...\n');

  const testCases = [
    // Valid plant-related questions
    {
      category: 'Valid Plant Questions',
      tests: [
        'Lá cây của tôi bị vàng, tôi nên làm gì?',
        'Khi nào nên tưới cây?',
        'Cây bị sâu hại phải xử lý thế nào?',
        'Phân bón nào tốt cho cây hoa hồng?',
        'Cây sen đá có cần nhiều nước không?',
        'Làm sao để cây lan ra hoa?'
      ]
    },
    
    // Invalid non-plant questions
    {
      category: 'Invalid Non-Plant Questions',
      tests: [
        'Thời tiết hôm nay thế nào?',
        'Làm sao để nấu phở ngon?',
        'Bệnh cảm cúm có nguy hiểm không?',
        'Phim hay nào đang chiếu?',
        'Giá Bitcoin hôm nay ra sao?',
        'Đội bóng nào sẽ thắng?'
      ]
    },
    
    // Vague questions
    {
      category: 'Vague Questions',
      tests: [
        'Làm sao để tốt hơn?',
        'Tại sao lại như vậy?',
        'Có nên làm không?',
        'Giúp tôi với',
        'Thế nào là đúng?'
      ]
    },
    
    // Greetings (should be allowed)
    {
      category: 'Greetings',
      tests: [
        'Chào bạn',
        'Hello',
        'Xin chào',
        'Cảm ơn bạn',
        'Thanks'
      ]
    },
    
    // Disease detection suggestions
    {
      category: 'Disease Detection Integration',
      tests: [
        'Cây có đốm nâu trên lá',
        'Lá bị héo và rụng',
        'Có sâu bọ trên cây'
      ]
    },
    
    // Watering suggestions
    {
      category: 'Watering Integration',
      tests: [
        'Bao lâu tưới cây một lần?',
        'Đất khô có nên tưới không?',
        'Cây bị úng nước phải làm sao?'
      ]
    }
  ];

  for (const category of testCases) {
    console.log(`\n📋 ${category.category}:`);
    console.log('=' + '='.repeat(category.category.length + 3));
    
    for (const question of category.tests) {
      try {
        console.log(`\n❓ Question: "${question}"`);
        
        const result = await openRouterService.generateChatResponse(question);
        
        console.log(`✅ Success: ${result.success}`);
        console.log(`🔍 Filtered: ${result.filtered || false}`);
        if (result.filtered) {
          console.log(`📝 Filter Reason: ${result.filterReason}`);
        }
        console.log(`🤖 Response: ${result.response.substring(0, 150)}${result.response.length > 150 ? '...' : ''}`);
        
        // Check for feature suggestions
        if (result.response.includes('Nhận diện bệnh')) {
          console.log('🔬 Disease detection suggestion: ✅');
        }
        if (result.response.includes('dự báo tưới nước')) {
          console.log('💧 Irrigation prediction suggestion: ✅');
        }
        
      } catch (error) {
        console.log(`❌ Error: ${error.message}`);
      }
    }
  }

  console.log('\n\n🧪 Testing Content Filtering Logic Directly...\n');
  
  // Test filtering logic directly
  const directTests = [
    'Thời tiết hôm nay',
    'Lá cây vàng',
    'Làm sao tốt hơn',
    'Chào bạn',
    'Cây bị bệnh'
  ];
  
  for (const test of directTests) {
    const filterResult = openRouterService.filterAndValidateMessage(test);
    console.log(`"${test}" -> Valid: ${filterResult.isValid}, Reason: ${filterResult.reason}`);
  }

  console.log('\n✅ Content filtering test completed!');
}

// Run test if called directly
if (require.main === module) {
  testContentFiltering();
}

module.exports = testContentFiltering;