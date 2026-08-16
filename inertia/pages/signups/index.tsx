import { Form } from '@adonisjs/inertia/react'
import {
  Badge,
  Box,
  Button,
  Card,
  Container,
  Divider,
  Drawer,
  Group,
  Indicator,
  Modal,
  NativeSelect,
  NumberInput,
  Select,
  SegmentedControl,
  SimpleGrid,
  Stack,
  ScrollArea,
  Text,
  TextInput,
  Title,
} from '@mantine/core'
import { IconChevronRight, IconSearch } from '@tabler/icons-react'
import { useMemo, useState } from 'react'
import type { Data } from '@generated/data'
import type { InertiaProps } from '~/types'

type PageProps = InertiaProps<{
  signups: Data.Signup[]
}>

type Signup = Data.Signup
type Learner = Signup['learners'][number]
type BillingStatus = Signup['billing']['status']
type Audience = 'ward' | 'adult' | 'compete'

type SignupRow = {
  signup: Signup
  learner: Learner | null
}

const ALL = 'all'

const STATUS_OPTIONS = [
  { value: ALL, label: 'All statuses' },
  { value: 'open', label: 'Awaiting review' },
  { value: 'pending_invoice', label: 'Invoice pending' },
  { value: 'invoice_sent', label: 'Invoice sent' },
  { value: 'paid', label: 'Paid' },
  { value: 'part_paid', label: 'Part paid' },
  { value: 'closed', label: 'Closed' },
]

function statusMeta(status: BillingStatus): { color: string; label: string } {
  switch (status) {
    case 'paid':
      return { color: 'green', label: 'Paid' }
    case 'part_paid':
      return { color: 'yellow', label: 'Part paid' }
    case 'invoice_sent':
      return { color: 'blue', label: 'Invoice sent' }
    case 'pending_invoice':
      return { color: 'orange', label: 'Invoice pending' }
    case 'closed':
      return { color: 'gray', label: 'Closed' }
    default:
      return { color: 'grape', label: 'Awaiting review' }
  }
}

function roleColor(audience: Audience): string {
  if (audience === 'adult') {
    return 'teal'
  }
  if (audience === 'compete') {
    return 'grape'
  }
  return 'indigo'
}

function signupReference(signup: Signup): string {
  return `SU-${String(signup.id).padStart(4, '0')}`
}

function hasMedicalFlag(learner: Learner | null): boolean {
  const info = learner?.medicalInfo?.trim().toLowerCase()
  return Boolean(info) && info !== 'none' && info !== 'n/a' && info !== '—'
}

/**
 * Public sign-ups arrive with the registrant role tucked into the contact name
 * ("Joe Turner (Guardian)") and the programme details serialised into the free-text
 * message. Split those out so the table can show a clean name, a role badge, and the
 * right programme / level / term / total columns even before an invoice exists.
 */
function splitContact(contactName: string): { name: string; role: string | null } {
  const match = contactName.match(/^\s*(.+?)\s*\(([^)]+)\)\s*$/)
  if (match) {
    return { name: match[1].trim(), role: match[2].trim() }
  }
  return { name: contactName.trim(), role: null }
}

function parseMessage(message: string | null) {
  const grab = (pattern: RegExp): string | null => {
    if (!message) {
      return null
    }
    const match = message.match(pattern)
    return match ? match[1].trim() : null
  }

  return {
    program: grab(/program\s*:\s*(.+)/i),
    level: grab(/level\s*:\s*(.+)/i),
    terms: grab(/terms?\s*:\s*(\d+)/i),
    total: grab(/estimated checkout total\s*:\s*(.+)/i) ?? grab(/fee per learner[^:]*:\s*(.+)/i),
  }
}

type ParsedMessage = ReturnType<typeof parseMessage>

function audienceFor(signup: Signup, role: string | null, parsed: ParsedMessage): Audience {
  const label = (role ?? '').toLowerCase()
  const program = (parsed.program ?? '').toLowerCase()

  if (
    program.includes('compete') ||
    program.includes('squad') ||
    label.includes('compete') ||
    label.includes('applicant') ||
    label.includes('squad')
  ) {
    return 'compete'
  }

  // Prefer the explicit registrant role captured at sign-up.
  if (signup.registrantRole === 'adult_learner') {
    return 'adult'
  }
  if (signup.registrantRole === 'guardian') {
    return 'ward'
  }

  // Fall back to the legacy "(Role)" convention, then learner age.
  if (label.includes('adult')) {
    return 'adult'
  }
  if (label.includes('guardian') || label.includes('parent') || label.includes('ward')) {
    return 'ward'
  }

  const singleLearner = signup.learners.length === 1 ? signup.learners[0] : null
  if (signup.billing.isEnquiry && !singleLearner) {
    return 'compete'
  }
  if (singleLearner && singleLearner.age >= 18) {
    return 'adult'
  }
  return 'ward'
}

function audienceDefaultLabel(audience: Audience): string {
  if (audience === 'adult') {
    return 'Adult learner'
  }
  if (audience === 'compete') {
    return 'Compete'
  }
  return 'Guardian'
}

function registrantRoleLabel(role: string | null): string | null {
  if (role === 'guardian') {
    return 'Guardian'
  }
  if (role === 'adult_learner') {
    return 'Adult learner'
  }
  return null
}

function relationLabel(relation: string | null | undefined): string | null {
  if (!relation) {
    return null
  }
  const labels: Record<string, string> = {
    mother: 'Mother',
    father: 'Father',
    guardian: 'Guardian',
    grandparent: 'Grandparent',
    sibling: 'Sibling',
    self: 'Self',
  }
  return labels[relation] ?? null
}

// The message field is auto-serialised with the programme/level/fee/terms, which
// the drawer already shows structured above. Strip those lines and keep only any
// genuine free-text note the registrant typed.
function messageNote(message: string | null): string | null {
  if (!message) {
    return null
  }
  const note = message
    .split('\n')
    .filter(
      (line) =>
        !/^\s*(program|level|fee per learner|terms?|estimated checkout total)\s*:/i.test(line)
    )
    .join('\n')
    .trim()
  return note || null
}

type SignupDisplay = {
  contactName: string
  roleLabel: string
  audience: Audience
  parsed: ParsedMessage
}

function deriveDisplay(signup: Signup): SignupDisplay {
  const { name, role } = splitContact(signup.contactName)
  const parsed = parseMessage(signup.message)
  const audience = audienceFor(signup, role, parsed)
  return {
    contactName: name,
    roleLabel: registrantRoleLabel(signup.registrantRole) ?? role ?? audienceDefaultLabel(audience),
    audience,
    parsed,
  }
}

function programAndLevel(learner: Learner | null, parsed: ParsedMessage) {
  const levelName = learner?.purchaseItem?.levelName ?? null
  if (parsed.program) {
    return { program: parsed.program, level: parsed.level }
  }
  if (levelName) {
    return { program: levelName, level: null }
  }
  return { program: learner ? 'Not selected' : 'General enquiry', level: null }
}

function totalLine(signup: Signup, parsed: ParsedMessage) {
  const total = signup.billing.totalAmount?.formatted ?? parsed.total ?? '—'
  const terms = parsed.terms ? `${parsed.terms} term${parsed.terms === '1' ? '' : 's'}` : null
  return { total, sub: terms ?? signup.billing.invoiceReference ?? 'No invoice yet' }
}

function StatusPill({ status }: { status: BillingStatus }) {
  const meta = statusMeta(status)
  return (
    <Badge
      variant="light"
      color={meta.color}
      radius="sm"
      leftSection={
        <Box
          w={7}
          h={7}
          style={{ borderRadius: '50%', background: `var(--mantine-color-${meta.color}-6)` }}
        />
      }
    >
      {meta.label}
    </Badge>
  )
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <Card withBorder radius="md" padding="md">
      <Text fw={900} fz={32} lh={1.1} c={color}>
        {value}
      </Text>
      <Text size="xs" tt="uppercase" fw={700} c="dimmed" mt={4} style={{ letterSpacing: 0.4 }}>
        {label}
      </Text>
    </Card>
  )
}

function SegLabel({ text, count }: { text: string; count: number }) {
  return (
    <Group gap={7} wrap="nowrap" justify="center">
      <span>{text}</span>
      <Badge size="sm" variant="light" color="gray" radius="sm">
        {count}
      </Badge>
    </Group>
  )
}

function SignupAction({
  signup,
  intent,
  children,
  variant = 'filled',
}: {
  signup: Signup
  intent: 'invoice_sent' | 'mark_paid' | 'close_enquiry' | 'reopen_enquiry'
  children: string
  variant?: 'filled' | 'default'
}) {
  return (
    <Form route="signups.update" routeParams={{ id: signup.id }}>
      {({ processing }) => (
        <>
          <input type="hidden" name="intent" value={intent} />
          <Button type="submit" loading={processing} variant={variant} fullWidth>
            {children}
          </Button>
        </>
      )}
    </Form>
  )
}

function paymentOptions(signup: Signup) {
  return signup.learners
    .filter((learner) => learner.termPayments.some((payment) => payment.balance.raw > 0))
    .map((learner) => ({
      value: String(learner.id),
      label: `${learner.firstName} ${learner.lastName}`,
    }))
}

function DetailField({ label, value }: { label: string; value: string | null }) {
  return (
    <Box
      p="sm"
      style={{
        border: '1px solid var(--mantine-color-gray-3)',
        borderRadius: 8,
      }}
    >
      <Text size="xs" tt="uppercase" fw={800} c="dimmed">
        {label}
      </Text>
      <Text size="sm" fw={600} mt={2}>
        {value?.trim() || '—'}
      </Text>
    </Box>
  )
}

function SignupDrawer({
  signup,
  opened,
  onClose,
}: {
  signup: Signup | null
  opened: boolean
  onClose: () => void
}) {
  const primaryLearner = signup?.learners[0]
  const isEnquiry = signup?.billing.isEnquiry ?? false
  const display = signup ? deriveDisplay(signup) : null
  const programme = signup ? programAndLevel(primaryLearner ?? null, display!.parsed) : null
  const totals = signup ? totalLine(signup, display!.parsed) : null
  const [partPaymentOpened, setPartPaymentOpened] = useState(false)
  const [paymentLearnerId, setPaymentLearnerId] = useState<string | null>(null)
  const [paymentTermId, setPaymentTermId] = useState<string | null>(null)
  const [paymentAmount, setPaymentAmount] = useState<number | ''>('')

  const paymentLearner = signup?.learners.find((learner) => String(learner.id) === paymentLearnerId)
  const paymentEligibleLearners =
    signup?.learners.filter((learner) =>
      learner.termPayments.some((payment) => payment.balance.raw > 0)
    ) ?? []
  const paymentTerms =
    paymentLearner?.termPayments.filter((payment) => payment.balance.raw > 0) ?? []
  const selectedTermPayment = paymentTerms.find(
    (payment) => String(payment.termId) === paymentTermId
  )

  function openPartPayment() {
    if (!signup) {
      return
    }

    const learner =
      paymentEligibleLearners[0] ??
      signup.learners.find((candidate) => candidate.termPayments.length > 0) ??
      signup.learners[0]
    if (!learner) {
      setPartPaymentOpened(true)
      return
    }
    const termPayment =
      learner.termPayments.find((payment) => payment.balance.raw > 0) ?? learner.termPayments[0]
    setPaymentLearnerId(String(learner.id))
    setPaymentTermId(termPayment ? String(termPayment.termId) : null)
    setPaymentAmount('')
    setPartPaymentOpened(true)
  }

  return (
    <>
      <Drawer
        opened={opened}
        onClose={onClose}
        position="right"
        size={520}
        padding="lg"
        title={null}
        scrollAreaComponent={ScrollArea.Autosize}
      >
        {signup && display && (
          <Stack gap="lg">
            <Stack gap={4}>
              <Group gap="xs">
                <StatusPill status={signup.billing.status} />
                {signup.billing.invoiceReference && (
                  <Text size="xs" c="dimmed">
                    {signup.billing.invoiceReference}
                  </Text>
                )}
                <Text size="xs" c="dimmed">
                  {signupReference(signup)}
                </Text>
              </Group>
              <Title order={2} fz="h3">
                {primaryLearner
                  ? `${primaryLearner.firstName} ${primaryLearner.lastName}`
                  : display.contactName}
              </Title>
              <Text size="sm" c="dimmed">
                Submitted {signup.createdAt.formatted}
                {signup.billing.invoiceSentAt
                  ? ` · invoice sent ${signup.billing.invoiceSentAt.formatted}`
                  : ''}
                {signup.billing.paidAt ? ` · paid ${signup.billing.paidAt.formatted}` : ''}
                {signup.billing.closedAt ? ` · closed ${signup.billing.closedAt.formatted}` : ''}
              </Text>
            </Stack>

            <Card withBorder radius="md" padding="md" bg="aqua.0">
              <Stack gap="sm">
                <Group justify="space-between" align="flex-start">
                  <div>
                    <Text fw={800}>{programme?.program}</Text>
                    <Group gap="xs" mt={4}>
                      {programme?.level && (
                        <Badge variant="light" color="aqua" radius="sm">
                          {programme.level}
                        </Badge>
                      )}
                      <Text size="sm" c="dimmed">
                        {signup.learners.length}{' '}
                        {signup.learners.length === 1 ? 'learner' : 'learners'}
                        {display.parsed.terms
                          ? ` · ${display.parsed.terms} term${display.parsed.terms === '1' ? '' : 's'}`
                          : ''}
                      </Text>
                    </Group>
                  </div>
                  <Text fw={800}>{totals?.total}</Text>
                </Group>

                {signup.billing.items.map((item) => (
                  <Group key={item.id} justify="space-between">
                    <Text size="sm" c="dimmed">
                      {item.levelName}
                    </Text>
                    <Text size="sm" fw={700}>
                      {item.amount.formatted}
                    </Text>
                  </Group>
                ))}

                <Divider />
                <Group justify="space-between">
                  <Text fw={800}>{isEnquiry ? 'Estimated total' : 'Invoice total'}</Text>
                  <Text fw={900} size="lg">
                    {totals?.total}
                  </Text>
                </Group>
              </Stack>
            </Card>

            {(signup.billing.canMarkInvoiceSent ||
              signup.billing.canMarkPaid ||
              signup.billing.canCloseEnquiry ||
              signup.billing.canReopenEnquiry) && (
              <Card withBorder radius="md" padding="md">
                <Group grow>
                  {signup.billing.canMarkInvoiceSent && (
                    <SignupAction signup={signup} intent="invoice_sent" variant="default">
                      Invoice sent
                    </SignupAction>
                  )}
                  {signup.billing.canMarkPaid && (
                    <SignupAction signup={signup} intent="mark_paid">
                      Mark as paid
                    </SignupAction>
                  )}
                  {signup.billing.canRecordPartPayment && (
                    <Button type="button" variant="default" onClick={openPartPayment} fullWidth>
                      Record part payment
                    </Button>
                  )}
                  {signup.billing.canCloseEnquiry && (
                    <SignupAction signup={signup} intent="close_enquiry" variant="default">
                      Close enquiry
                    </SignupAction>
                  )}
                  {signup.billing.canReopenEnquiry && (
                    <SignupAction signup={signup} intent="reopen_enquiry">
                      Reopen enquiry
                    </SignupAction>
                  )}
                </Group>
              </Card>
            )}

            {signup.learners.length > 0 && (
              <Stack gap="sm">
                <Group justify="space-between">
                  <Text size="xs" tt="uppercase" fw={800} c="dimmed">
                    Learner details
                  </Text>
                  <Text size="xs" c="dimmed">
                    {signup.learners.length} total
                  </Text>
                </Group>
                {signup.learners.map((learner) => (
                  <Card key={learner.id} withBorder radius="md" padding="md">
                    <Stack gap="sm">
                      <Group justify="space-between" align="flex-start">
                        <div>
                          <Text fw={800}>
                            {learner.firstName} {learner.lastName}
                          </Text>
                          <Text size="sm" c="dimmed">
                            Age {learner.age} · {learner.gender}
                          </Text>
                        </div>
                        {learner.purchaseItem && (
                          <Badge variant="light" color="aqua">
                            {learner.purchaseItem.levelName}
                          </Badge>
                        )}
                      </Group>
                      <SimpleGrid cols={{ base: 1, sm: 2 }}>
                        <DetailField label="Date of birth" value={learner.dateOfBirth.formatted} />
                        <DetailField label="Relationship" value={relationLabel(learner.relation)} />
                        <DetailField label="Nationality" value={learner.nationality} />
                        <DetailField
                          label="Residential location"
                          value={learner.residentialLocation}
                        />
                        <DetailField label="Medical information" value={learner.medicalInfo} />
                      </SimpleGrid>
                      <DetailField label="Swimming experience" value={learner.swimmingExperience} />
                    </Stack>
                  </Card>
                ))}
              </Stack>
            )}

            <Stack gap="sm">
              <Group justify="space-between">
                <Text size="xs" tt="uppercase" fw={800} c="dimmed">
                  {isEnquiry ? 'Contact details' : 'Registered by'}
                </Text>
                <Badge variant="light" color={roleColor(display.audience)} radius="sm">
                  {display.roleLabel}
                </Badge>
              </Group>
              <Card withBorder radius="md" padding="md">
                <Stack gap="sm">
                  <Group gap="sm">
                    <div>
                      <Text fw={800}>{display.contactName}</Text>
                      <Text size="sm" c="dimmed">
                        {display.roleLabel}
                      </Text>
                    </div>
                  </Group>
                  <SimpleGrid cols={{ base: 1, sm: 2 }}>
                    <DetailField label="Email" value={signup.contactEmail} />
                    <DetailField label="Phone" value={signup.contactPhone} />
                    <DetailField label="WhatsApp" value={signup.whatsapp} />
                    {messageNote(signup.message) && (
                      <DetailField label="Note" value={messageNote(signup.message)} />
                    )}
                  </SimpleGrid>
                </Stack>
              </Card>
            </Stack>
          </Stack>
        )}
      </Drawer>
      {signup && (
        <Modal
          opened={partPaymentOpened}
          onClose={() => setPartPaymentOpened(false)}
          title="Record part payment"
          centered
          withinPortal
          zIndex={2000}
        >
          <Form
            route="signups.update"
            routeParams={{ id: signup.id }}
            onSuccess={() => setPartPaymentOpened(false)}
          >
            {({ processing }) => (
              <Stack gap="md">
                <input type="hidden" name="intent" value="record_part_payment" />
                <input type="hidden" name="learnerId" value={paymentLearnerId ?? ''} />
                <input type="hidden" name="termId" value={paymentTermId ?? ''} />
                <input type="hidden" name="amount" value={paymentAmount} />
                <Select
                  label="Learner"
                  value={paymentLearnerId}
                  onChange={(value) => {
                    setPaymentLearnerId(value)
                    const learner = signup.learners.find(
                      (candidate) => String(candidate.id) === value
                    )
                    const firstOutstanding = learner?.termPayments.find(
                      (payment) => payment.balance.raw > 0
                    )
                    setPaymentTermId(firstOutstanding ? String(firstOutstanding.termId) : null)
                    setPaymentAmount('')
                  }}
                  data={paymentOptions(signup)}
                  searchable={signup.learners.length > 6}
                  required
                />
                <Select
                  label="Term"
                  value={paymentTermId}
                  onChange={(value) => {
                    setPaymentTermId(value)
                    setPaymentAmount('')
                  }}
                  data={paymentTerms.map((payment) => ({
                    value: String(payment.termId),
                    label: `${payment.termName} · ${payment.balance.formatted} remaining`,
                  }))}
                  placeholder="Select a term"
                  required
                />
                {selectedTermPayment && (
                  <Text size="sm" c="dimmed">
                    Paid {selectedTermPayment.amountPaid.formatted} of{' '}
                    {selectedTermPayment.amount.formatted}. Maximum payment:{' '}
                    {selectedTermPayment.balance.formatted}.
                  </Text>
                )}
                <NumberInput
                  label="Amount received"
                  placeholder="0.00"
                  prefix="GHS "
                  min={0.01}
                  max={
                    selectedTermPayment?.balance.raw
                      ? selectedTermPayment.balance.raw / 100
                      : undefined
                  }
                  decimalScale={2}
                  fixedDecimalScale
                  value={paymentAmount}
                  onChange={(value) => {
                    if (value === '') {
                      setPaymentAmount('')
                      return
                    }

                    const numericValue = typeof value === 'number' ? value : Number(value)
                    setPaymentAmount(Number.isFinite(numericValue) ? numericValue : '')
                  }}
                  required
                />
                <Group justify="flex-end">
                  <Button variant="default" onClick={() => setPartPaymentOpened(false)}>
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    loading={processing}
                    disabled={!paymentLearnerId || !paymentTermId || paymentAmount === ''}
                  >
                    Record payment
                  </Button>
                </Group>
              </Stack>
            )}
          </Form>
        </Modal>
      )}
    </>
  )
}

export default function SignupsIndex({ signups }: PageProps) {
  const [audience, setAudience] = useState<Audience | typeof ALL>(ALL)
  const [statusFilter, setStatusFilter] = useState<BillingStatus | typeof ALL>(ALL)
  const [search, setSearch] = useState('')
  const [levelFilter, setLevelFilter] = useState(ALL)
  const [selectedSignupId, setSelectedSignupId] = useState<number | null>(null)

  const displayById = useMemo(
    () => new Map(signups.map((signup) => [signup.id, deriveDisplay(signup)])),
    [signups]
  )

  const rows = useMemo<SignupRow[]>(
    () =>
      signups.flatMap((signup): SignupRow[] =>
        signup.learners.length > 0
          ? signup.learners.map((learner) => ({ signup, learner }))
          : [{ signup, learner: null }]
      ),
    [signups]
  )

  const levelOptions = useMemo(() => {
    const levels = new Set<string>()
    for (const row of rows) {
      const display = displayById.get(row.signup.id)
      const { program, level } = programAndLevel(row.learner, display?.parsed ?? parseMessage(null))
      const value = level ?? program
      if (value && value !== 'Not selected' && value !== 'General enquiry') {
        levels.add(value)
      }
    }
    return [
      { value: ALL, label: 'All levels' },
      ...[...levels].sort().map((level) => ({ value: level, label: level })),
    ]
  }, [rows, displayById])

  const audienceCounts = useMemo(() => {
    const counts = { all: rows.length, ward: 0, adult: 0, compete: 0 }
    for (const row of rows) {
      const display = displayById.get(row.signup.id)
      if (display) {
        counts[display.audience] += 1
      }
    }
    return counts
  }, [rows, displayById])

  const filteredRows = rows.filter((row) => {
    const display = displayById.get(row.signup.id)
    const { program, level } = programAndLevel(row.learner, display?.parsed ?? parseMessage(null))
    const levelValue = level ?? program

    const searchable = [
      row.learner?.firstName,
      row.learner?.lastName,
      display?.contactName,
      row.signup.contactEmail,
      row.signup.contactPhone,
      program,
      level,
      signupReference(row.signup),
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()

    return (
      (audience === ALL || display?.audience === audience) &&
      (statusFilter === ALL || row.signup.billing.status === statusFilter) &&
      (levelFilter === ALL || levelValue === levelFilter) &&
      searchable.includes(search.trim().toLowerCase())
    )
  })

  const selectedSignup = signups.find((signup) => signup.id === selectedSignupId) ?? null

  const stats = {
    learners: signups.reduce((total, signup) => total + signup.learners.length, 0),
    signups: signups.length,
    pending: signups.filter((signup) => signup.billing.status === 'pending_invoice').length,
    sent: signups.filter((signup) => signup.billing.status === 'invoice_sent').length,
  }

  return (
    <Container size="xl" py="xl">
      <Stack gap="lg">
        <div>
          <Text size="xs" tt="uppercase" fw={800} c="dimmed" style={{ letterSpacing: 0.6 }}>
            Enrolment
          </Text>
          <Title order={1}>Sign-ups</Title>
          <Text c="dimmed" maw={720} mt={4}>
            Every learner registered through your public page — wards signed up by a parent or
            guardian, adults registering themselves, and Compete applicants. Open a sign-up to see
            who registered them and where the invoice stands.
          </Text>
        </div>

        <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="sm">
          <StatCard label="Learners" value={stats.learners} color="aqua.7" />
          <StatCard label="Sign-ups" value={stats.signups} color="dark.5" />
          <StatCard label="Invoice pending" value={stats.pending} color="orange.7" />
          <StatCard label="Invoice sent" value={stats.sent} color="blue.7" />
        </SimpleGrid>

        <SegmentedControl
          value={audience}
          onChange={(value) => setAudience(value as Audience | typeof ALL)}
          data={[
            { value: ALL, label: <SegLabel text="All learners" count={audienceCounts.all} /> },
            { value: 'ward', label: <SegLabel text="Wards" count={audienceCounts.ward} /> },
            { value: 'adult', label: <SegLabel text="Adults" count={audienceCounts.adult} /> },
            {
              value: 'compete',
              label: <SegLabel text="Compete" count={audienceCounts.compete} />,
            },
          ]}
        />

        <Group gap="sm" align="center">
          <TextInput
            flex={1}
            leftSection={<IconSearch size={18} />}
            placeholder="Search name, email, phone, or reference"
            value={search}
            onChange={(event) => setSearch(event.currentTarget.value)}
          />
          <NativeSelect
            w={{ base: '100%', sm: 170 }}
            value={levelFilter}
            onChange={(event) => setLevelFilter(event.currentTarget.value)}
            data={levelOptions}
          />
          <NativeSelect
            w={{ base: '100%', sm: 180 }}
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(event.currentTarget.value as BillingStatus | typeof ALL)
            }
            data={STATUS_OPTIONS}
          />
        </Group>

        <Card withBorder padding={0} radius="md">
          {filteredRows.length === 0 ? (
            <Text c="dimmed" p="lg">
              No sign-ups match this view.
            </Text>
          ) : (
            <Stack gap={0}>
              <SimpleGrid
                cols={5}
                spacing={0}
                px="md"
                py="sm"
                visibleFrom="md"
                style={{ borderBottom: '1px solid var(--mantine-color-gray-3)' }}
              >
                {['Learner', 'Registered by', 'Programme & level', 'Total', 'Status'].map(
                  (heading) => (
                    <Text key={heading} size="xs" tt="uppercase" fw={800} c="dimmed">
                      {heading}
                    </Text>
                  )
                )}
              </SimpleGrid>
              {filteredRows.map(({ signup, learner }) => {
                const display = displayById.get(signup.id)!
                const { program, level } = programAndLevel(learner, display.parsed)
                const totals = totalLine(signup, display.parsed)
                const others = Math.max(signup.learners.length - 1, 0)
                const flagged = hasMedicalFlag(learner)
                const relation = relationLabel(learner?.relation)

                return (
                  <Box
                    key={learner ? `${signup.id}-${learner.id}` : `inquiry-${signup.id}`}
                    component="button"
                    type="button"
                    className="signup-row"
                    onClick={() => setSelectedSignupId(signup.id)}
                    px="md"
                    py="sm"
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      border: 0,
                      borderBottom: '1px solid var(--mantine-color-gray-2)',
                      background: 'transparent',
                      cursor: 'pointer',
                    }}
                  >
                    <SimpleGrid cols={{ base: 1, md: 5 }} spacing="sm" verticalSpacing="xs">
                      <Group gap="sm" wrap="nowrap">
                        {flagged && (
                          <Indicator color="orange" size={10} offset={4} withBorder label="">
                            <Box w={8} h={8} />
                          </Indicator>
                        )}
                        <div>
                          <Text fw={700}>
                            {learner
                              ? `${learner.firstName} ${learner.lastName}`
                              : display.contactName}
                          </Text>
                          <Text size="xs" c="dimmed">
                            {learner ? `Age ${learner.age} · ${learner.gender}` : 'General enquiry'}
                          </Text>
                        </div>
                      </Group>

                      <div>
                        <Text fw={600} lineClamp={1}>
                          {display.contactName}
                        </Text>
                        <Group gap={6} mt={4} wrap="nowrap">
                          <Badge
                            variant="light"
                            color={roleColor(display.audience)}
                            radius="sm"
                            size="sm"
                          >
                            {display.roleLabel}
                          </Badge>
                          <Text size="xs" c="dimmed" style={{ whiteSpace: 'nowrap' }}>
                            {relation ? `${relation} · ` : ''}
                            {signupReference(signup)}
                            {others > 0 ? ` · +${others}` : ''}
                          </Text>
                        </Group>
                      </div>

                      <div>
                        <Text fw={600} lineClamp={1}>
                          {program}
                        </Text>
                        <Group gap={6} mt={4}>
                          {level && (
                            <Badge variant="light" color="aqua" radius="sm" size="sm">
                              {level}
                            </Badge>
                          )}
                          {!level && (
                            <Text size="xs" c="dimmed">
                              {signup.billing.isEnquiry ? 'Awaiting review' : 'No level yet'}
                            </Text>
                          )}
                        </Group>
                      </div>

                      <div>
                        <Text fw={800}>{totals.total}</Text>
                        <Text size="xs" c="dimmed">
                          {totals.sub}
                        </Text>
                      </div>

                      <Group justify="space-between" wrap="nowrap">
                        <div>
                          <StatusPill status={signup.billing.status} />
                          <Text size="xs" c="dimmed" mt={4}>
                            {signup.billing.paidAt?.formatted ??
                              signup.billing.invoiceSentAt?.formatted ??
                              signup.billing.closedAt?.formatted ??
                              signup.createdAt.formatted}
                          </Text>
                        </div>
                        <IconChevronRight size={18} color="var(--mantine-color-gray-5)" />
                      </Group>
                    </SimpleGrid>
                  </Box>
                )
              })}
            </Stack>
          )}
        </Card>
      </Stack>

      <SignupDrawer
        signup={selectedSignup}
        opened={selectedSignup !== null}
        onClose={() => setSelectedSignupId(null)}
      />
    </Container>
  )
}
