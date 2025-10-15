const openRouterService = require('./services/openRouterService');

function testFilteringLogic() {
  console.log('🧪 Testing Content Filtering Logic...\n');

  const testCases = [
    // Valid plant-related questions
    {
      category: '✅ Valid Plant Questions',
      questions: [
        'Lá cây của tôi bị vàng',
        'Khi nào nên tưới cây?',
        'Cây bị sâu hại',
        'Phân bón cho hoa hồng',
        'Cây sen đá cần nước không?',
        'Làm sao để cây lan ra hoa?',
        'Đất trồng cây nào tốt?',
        'Cây bonsai cần ánh sáng như thế nào?'
      ],
      expectedValid: true
    },
    
    // Invalid non-plant questions
    {
      category: '❌ Invalid Non-Plant Questions',
      questions: [
        'Thời tiết hôm nay thế nào?',
        'Làm sao để nấu phở ngon?',
        'Bệnh cảm cúm có nguy hiểm không?',
        'Phim hay nào đang chiếu?',
        'Giá Bitcoin hôm nay ra sao?',
        'Đội bóng nào sẽ thắng?',
        'Máy tính bị lỗi',
        'Cách đi du lịch Đà Lạt'
      ],
      expectedValid: false
    },
    
    // Vague questions
    {
      category: '❓ Vague Questions',
      questions: [
        'Làm sao để tốt hơn?',
        'Tại sao lại như vậy?',
        'Có nên làm không?',
        'Giúp tôi với',
        'Thế nào là đúng?'
      ],
      expectedValid: false
    },
    
    // Greetings (should be allowed)
    {
      category: '👋 Greetings (Should be Valid)',
      questions: [
        'Chào bạn',
        'Hello',
        'Xin chào',
        'Cảm ơn bạn',
        'Thanks'
      ],
      expectedValid: true
    }
  ];

  let totalTests = 0;
  let passedTests = 0;

  for (const testCase of testCases) {
    console.log(`\n${testCase.category}:`);
    console.log('-'.repeat(testCase.category.length + 1));
    
    for (const question of testCase.questions) {
      totalTests++;
      
      const filterResult = openRouterService.filterAndValidateMessage(question);
      const passed = filterResult.isValid === testCase.expectedValid;
      
      if (passed) {
        passedTests++;
        console.log(`✅ "${question}" -> ${filterResult.isValid ? 'Valid' : 'Invalid'} (${filterResult.reason})`);
      } else {
        console.log(`❌ "${question}" -> ${filterResult.isValid ? 'Valid' : 'Invalid'} (${filterResult.reason}) [EXPECTED: ${testCase.expectedValid ? 'Valid' : 'Invalid'}]`);
      }
      
      if (!filterResult.isValid && filterResult.suggestion) {
        console.log(`   💬 Suggestion: "${filterResult.suggestion}"`);
      }
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log(`📊 Test Results: ${passedTests}/${totalTests} tests passed (${Math.round(passedTests/totalTests*100)}%)`);
  
  if (passedTests === totalTests) {
    console.log('🎉 All content filtering tests passed!');
  } else {
    console.log('⚠️  Some tests failed. Review the filtering logic.');
  }

  // Test specific edge cases
  console.log('\n🔍 Testing Edge Cases:');
  console.log('-'.repeat(20));
  
  const edgeCases = [
    'cây thời tiết', // Has plant keyword but also forbidden
    'tưới nước mưa', // Plant-related but mentions weather
    'bệnh cây người', // Plant + forbidden topic
    'chào cây của tôi', // Greeting + plant
    'cây cây cây' // Repetitive plant keywords
  ];
  
  for (const edge of edgeCases) {
    const result = openRouterService.filterAndValidateMessage(edge);
    console.log(`🔍 "${edge}" -> ${result.isValid ? 'Valid' : 'Invalid'} (${result.reason})`);
  }

  console.log('\n✅ Content filtering logic test completed!');
}

// Run test
testFilteringLogic();