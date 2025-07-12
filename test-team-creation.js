require('dotenv').config({ path: '.env.local' });
const { neon } = require('@neondatabase/serverless');

async function testTeamMemberCreation() {
  const sql = neon(process.env.NEON_NEON_DATABASE_URL);
  
  try {
    // Create a test team member
    const testMember = {
      name: 'Test User',
      title: 'Software Developer',
      department: 'Engineering',
      bio: 'Test bio',
      email: 'test@example.com',
      phone: '123-456-7890',
      location: 'Test Location',
      skills: ['JavaScript', 'React'],
      achievements: ['Test Achievement'],
      social_linkedin: 'https://linkedin.com/in/test',
      social_twitter: 'https://twitter.com/test',
      social_github: 'https://github.com/test',
      social_portfolio: 'https://test.com',
      avatar_url: '/placeholder-user.jpg',
      is_lead: false,
      is_active: true
    };
    
    console.log('Creating team member with data:', testMember);
    
    const [newTeamMember] = await sql`
      INSERT INTO team_members (
        name, title, department, bio, email, phone, location, 
        skills, achievements, social_linkedin, social_twitter, 
        social_github, social_portfolio, avatar_url, is_lead, is_active
      )
      VALUES (
        ${testMember.name},
        ${testMember.title},
        ${testMember.department},
        ${testMember.bio},
        ${testMember.email},
        ${testMember.phone},
        ${testMember.location},
        ${testMember.skills},
        ${testMember.achievements},
        ${testMember.social_linkedin},
        ${testMember.social_twitter},
        ${testMember.social_github},
        ${testMember.social_portfolio},
        ${testMember.avatar_url},
        ${testMember.is_lead},
        ${testMember.is_active}
      )
      RETURNING *
    `;
    
    console.log('Successfully created team member:', newTeamMember);
    
    // Check total count
    const count = await sql`SELECT COUNT(*) as count FROM team_members`;
    console.log('Total team members in database:', count[0].count);
    
  } catch (error) {
    console.error('Error testing team member creation:', error);
  }
}

testTeamMemberCreation();
