import React from 'react'
import { GetStaticProps, GetStaticPaths } from 'next'
import { ParsedUrlQuery } from 'querystring'
import { Main as MainLayout } from 'components/layouts/main'
import { Featured } from 'components/featured'
import { AirtableItemService } from 'services/airtable'
import { Category } from 'types/category'
import { NavigationProvider } from 'context/navigation'
import { SEO } from 'components/SEO'
import { DEFAULT_REVALIDATE_PERIOD } from 'utils/constants'
import styles from '../pages.module.scss'
import { JobService } from 'services/jobs'
import { Job } from 'types/job'
import { Row } from 'components/row'
import  moment from 'dayjs'
import { Company } from 'types/company'

interface Props {
    categories: Array<Category>
    company: Company | null
    jobs: Array<Job>
}

interface Params extends ParsedUrlQuery {
    company: string
}

export default function Index(props: Props) {
  if (!props.company) {
    return <></>
  }

  return (
    <NavigationProvider categories={props.categories}>
      <SEO title={props.company.title} />

      <MainLayout className={styles.container} title={props.company.title}>
        <article className={styles.body} dangerouslySetInnerHTML={{__html: props.company.body }} />
        
        <h3>Jobs</h3>
        <main>
          <Featured type='rows'>
            {props.jobs.map(i => {
              return (
                <Row
                  key={`${i.id}_${i.location}`}
                  title={i.title}
                  description={i.location}
                  date={moment(i.updated).fromNow()}
                  author={i.company.title}
                  authorUrl={i.company.id}
                  url={i.url} />
              )
            })}
          </Featured>
        </main>
      </MainLayout>
    </NavigationProvider>
  )
}

export const getStaticPaths: GetStaticPaths = async () => {
  const service = new JobService()
  const jobs = await service.GetJobs()
  const companies = [...new Set(jobs.map(i => i.company.id))]

  return {
    paths: companies.map(i => {
      return {
        params: { company: i }
      }
    }),
    fallback: true
  }
}

export const getStaticProps: GetStaticProps<Props, Params> = async (context) => {
  const companyId = context.params?.company
  if (!companyId) {
    return {
      props: null,
      notFound: true,
    }
  }
  
  const service = new AirtableItemService()
  const categories = await service.GetCategories()
  const jobService = new JobService()
  const jobs = await jobService.GetJobs(companyId)
  const company = jobs.length > 0 ? jobs[0].company : null
  
  return {
    props: {
      categories,
      company,
      jobs
    },
    revalidate: DEFAULT_REVALIDATE_PERIOD
  }
}
