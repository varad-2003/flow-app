import { Button } from '@/components/ui/button'
import { LoginLink } from '@kinde-oss/kinde-auth-nextjs'
import React from 'react'

const Page = () => {
  return <div>
    <header>
      landing Page
      <LoginLink>
        <Button>
        Sign In
      </Button>
      </LoginLink>
    </header>
  </div>
}

export default Page