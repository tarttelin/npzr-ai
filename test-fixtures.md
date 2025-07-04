Simplify game-ui tests by reducing the use of mocks and introducing test fixtures.

- game-ui tests should use test fixtures and favour testing with fewer mocked components. 
- Test data should be sourced from a test-fixtures utility, enabling multiple tests to use the 
same builders for creating valid data to pass from your tests.
- Test fixture data should be meaningful, but varied. Use @faker-js/faker to create meaningful data.
- Test data should be created on each request to the fixture. The fixture should not mutate existing test data instances
- Tests should use real sub components when the side effects of doing so are small enough. This level of component integration testing is a useful byproduct
- Mocks are still useful when avoiding functions with side effects that would come from other packages
- Because of the nature of pixijs managing a rendering loop, mocking interactions with pixijs is still necessary
- GameEngine, Player, Hand, Card are all good examples where they should be constructed as real instances by a test fixture.