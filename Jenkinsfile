pipeline {
    agent { label 'linux' }

    options {
        timestamps()
        ansiColor('xterm')
        disableConcurrentBuilds(abortPrevious: true)
        skipDefaultCheckout(true)
    }

    parameters {
        booleanParam(
            name: 'RUN_FRONTEND_TESTS',
            defaultValue: false,
            description: 'React Native / Expo tests are flaky in CI until mocks are stabilized.'
        )
    }

    environment {
        BACKEND_SERVICES = 'core-service discovery-service gateway-service insight-service pay-service'
        DEPLOY_HOST = 'ubuntu@3.39.255.72'
        DEPLOY_PATH = '/home/ubuntu/duckchi'
        COMPOSE_FILE = 'docker-compose.prod.yml'
        REQUIRED_ENV_VARS = 'SPRING_PROFILES_ACTIVE DB_HOST DB_PORT DB_USERNAME DB_PASSWORD CORE_DB_NAME PAY_DB_NAME INSIGHT_DB_NAME REDIS_HOST REDIS_PORT EUREKA_SERVER_URL'
    }

    stages {
        stage('Checkout Source') {
            steps {
                checkout scm
            }
        }

        stage('Checkout Summary') {
            steps {
                sh 'pwd'
                sh 'git rev-parse --short HEAD'
                sh 'ls -al'
            }
        }

        stage('Validate Backend Layout') {
            steps {
                sh '''
                    set -eu
                    for service in ${BACKEND_SERVICES}; do
                      test -f "DOCK-BE/${service}/build.gradle"
                      test -f "DOCK-BE/${service}/gradlew"
                    done
                '''
            }
        }

       stage('Build Backend Services') {
           steps {
               sh '''
                   set -eu
                   for service in ${BACKEND_SERVICES}; do
                     echo "===> Building ${service}"
                     cd "DOCK-BE/${service}"
                     chmod +x ./gradlew
                     if [ "${JOB_NAME}" = "duckchi-cd-develop" ] || [[ "${JOB_NAME}" == */duckchi-cd-develop ]]; then
                       ./gradlew clean bootJar -x test
                     else
                       ./gradlew clean build
                     fi
                     cd "${WORKSPACE}"
                   done
               '''
           }
       }

            }
        }

        stage('Frontend Lint') {
            when {
                expression {
                    return env.JOB_NAME == 'duckchi-ci' || env.JOB_NAME?.endsWith('/duckchi-ci')
                }
            }
            steps {
                dir('DOCK-FE') {
                    sh '''
                        set -eu
                        node --version
                        npm --version
                        npm ci
                        npm run lint
                    '''
                }
            }
        }

        stage('Frontend Test') {
            when {
                allOf {
                    expression {
                        return env.JOB_NAME == 'duckchi-ci' || env.JOB_NAME?.endsWith('/duckchi-ci')
                    }
                    expression { return params.RUN_FRONTEND_TESTS }
                }
            }
            steps {
                dir('DOCK-FE') {
                    sh '''
                        set -eu
                        CI=true npm test -- --watchAll=false
                    '''
                }
            }
        }

        stage('Validate CD Prerequisites') {
            when {
                expression {
                    return env.JOB_NAME == 'duckchi-cd-develop' || env.JOB_NAME?.endsWith('/duckchi-cd-develop')
                }
            }
            steps {
                sh '''
                    set -eu
                    for service in ${BACKEND_SERVICES}; do
                      test -f "DOCK-BE/${service}/Dockerfile"
                    done
                '''
            }
        }

        stage('Prepare Docker Artifacts') {
            when {
                expression {
                    return env.JOB_NAME == 'duckchi-cd-develop' || env.JOB_NAME?.endsWith('/duckchi-cd-develop')
                }
            }
            steps {
                sh '''
                    set -eu
                    for service in ${BACKEND_SERVICES}; do
                      cd "DOCK-BE/${service}"

                      JAR_COUNT="$(find build/libs -maxdepth 1 -type f -name '*.jar' ! -name '*-plain.jar' | wc -l)"
                      if [ "${JAR_COUNT}" -ne 1 ]; then
                        echo "Expected exactly one executable jar for ${service}, found ${JAR_COUNT}"
                        find build/libs -maxdepth 1 -type f -name '*.jar' -print
                        exit 1
                      fi

                      JAR_PATH="$(find build/libs -maxdepth 1 -type f -name '*.jar' ! -name '*-plain.jar' | head -n 1)"
                      cp "${JAR_PATH}" app.jar
                      cd "${WORKSPACE}"
                    done
                '''
            }
        }

        stage('Build And Push Backend Images') {
            when {
                expression {
                    return env.JOB_NAME == 'duckchi-cd-develop' || env.JOB_NAME?.endsWith('/duckchi-cd-develop')
                }
            }
            steps {
                withCredentials([
                    usernamePassword(
                        credentialsId: 'dockerhub-creds',
                        usernameVariable: 'DOCKERHUB_USERNAME',
                        passwordVariable: 'DOCKERHUB_TOKEN'
                    )
                ]) {
                    sh '''
                        set -eu
                        echo "${DOCKERHUB_TOKEN}" | docker login -u "${DOCKERHUB_USERNAME}" --password-stdin

                        for service in ${BACKEND_SERVICES}; do
                          IMAGE_NAME="${DOCKERHUB_USERNAME}/duckchi-${service}"
                          docker build \
                            -t "${IMAGE_NAME}:${BUILD_NUMBER}" \
                            -t "${IMAGE_NAME}:latest" \
                            "DOCK-BE/${service}"

                          docker push "${IMAGE_NAME}:${BUILD_NUMBER}"
                          docker push "${IMAGE_NAME}:latest"
                        done
                    '''
                }
            }
        }

        stage('Deploy To EC2') {
            when {
                expression {
                    return env.JOB_NAME == 'duckchi-cd-develop' || env.JOB_NAME?.endsWith('/duckchi-cd-develop')
                }
            }
            steps {
                withCredentials([
                    usernamePassword(
                        credentialsId: 'dockerhub-creds',
                        usernameVariable: 'DOCKERHUB_USERNAME',
                        passwordVariable: 'DOCKERHUB_TOKEN'
                    )
                ]) {
                    sshagent(credentials: ['ec2-deploy-key']) {
                        sh '''
                            set -eu
                            set +x
                            ssh -o BatchMode=yes "${DEPLOY_HOST}" 'bash -se' <<REMOTE
set -eu
cd "${DEPLOY_PATH}"
test -f "${COMPOSE_FILE}"
test -f .env

for key in ${REQUIRED_ENV_VARS}; do
  if ! grep -q "^\\${key}=.\\+" .env; then
    echo "Missing required env: \\${key}"
    exit 1
  fi
done

TOKEN_FILE="\$(mktemp)"
trap 'rm -f "\${TOKEN_FILE}"' EXIT

cat > "\${TOKEN_FILE}" <<'TOKEN_EOF'
${DOCKERHUB_TOKEN}
TOKEN_EOF

cat "\${TOKEN_FILE}" | docker login -u "${DOCKERHUB_USERNAME}" --password-stdin
export REGISTRY_NAMESPACE="${DOCKERHUB_USERNAME}"
export IMAGE_TAG="${BUILD_NUMBER}"
docker-compose -f "${COMPOSE_FILE}" config >/dev/null
docker-compose -f "${COMPOSE_FILE}" pull
docker-compose -f "${COMPOSE_FILE}" up -d --remove-orphans
REMOTE
                        '''
                    }
                }
            }
        }
    }

    post {
        success {
            echo "Job ${JOB_NAME} completed successfully"
        }
        failure {
            echo "Job ${JOB_NAME} failed"
        }
        always {
            archiveArtifacts artifacts: 'DOCK-BE/**/build/libs/*.jar', onlyIfSuccessful: false
            sh '''
                set +e
                find DOCK-BE -maxdepth 2 -type f -name app.jar -delete
            '''
        }
    }
}
